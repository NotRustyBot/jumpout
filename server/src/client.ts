import { AutoView } from "@shared/datagram";
import { WebSocket } from "ws";
import { ClientData, Message, ObjectScope,  Sync } from "./registry";
import { headerId } from "@shared/netManager";
import { messageType, netMessage } from "@shared/messages";
import { Detectable } from "./server/detectable";
import { IncidentRotuer, trippable } from "@shared/incident";
import { BaseObject } from "@shared/baseObject";

type tracking = { initialised: boolean; wasTracked: boolean };

export class Client {
    static online = new Map<number, Client>();
    private socket: WebSocket;
    private secret: string;
    id: number;
    tracked = new Map<Detectable, tracking>();
    data: ClientData;

    private messages: Array<netMessage> = [];
    sync: Sync;
    clientObject: BaseObject;

    constructor(socket: WebSocket, id: number, secret: string) {
        this.socket = socket;
        this.secret = secret;
        this.id = id;
        Client.online.set(id, this);
    }

    setupObject() {
        const data = ClientData.list.get(this.id);
        if (data) {
            this.clientObject = data.parent;
            this.data = data;
            this.sync = data.parent.getComponentByType(Sync);
        } else {
            this.clientObject = ObjectScope.network.createObject();
            this.data = this.clientObject.addComponent(ClientData);
            this.sync = this.clientObject.addComponent(Sync);
            this.data.userId = this.id;
            this.data.secret = this.secret;
            this.sync.authorize([this.data]);
            this.sync.exclusivity([this.data], this.id);
            this.clientObject.initialiseComponents();
        }
    }

    debugCam?: BaseObject;

    send(view: AutoView) {
        const buffer = view.buffer.slice(0, view.index);
        this.socket.send(buffer);
    }

    track(detectable: Detectable) {
        if (!this.tracked.has(detectable)) {
            this.tracked.set(detectable, { initialised: false, wasTracked: true });
        } else {
            this.tracked.get(detectable).wasTracked = true;
        }
    }

    untrack(detectable: Detectable) {
        const tracked = this.tracked.get(detectable);
        if (tracked) {
            this.message({
                typeId: messageType.untrackObject,
                objectId: detectable.netId
            });
            this.tracked.delete(detectable);
        }
    }

    message(data: netMessage) {
        this.messages.push(data);
    }

    untrackAll() {
        for (const [detectable, _] of this.tracked) {
            this.untrack(detectable);
        }
    }

    writeObjects(view: AutoView) {
        view.writeUint16(headerId.objects);
        const index = view.index;
        let actualSize = 0;
        view.writeUint16(0);
        for (const [detectable, tracked] of this.tracked) {
            if (!tracked.wasTracked) {
                this.untrack(detectable);
            }

            const sync = detectable.sync;
            if (tracked.initialised) {
                const serialised = sync.writeAuthorityBits(view, this.id);
                if (serialised) actualSize++;
            } else {
                sync.writeAllBits(view, this.id);
                tracked.initialised = true;
                actualSize++;
            }

            tracked.wasTracked = false;
        }

        const serialised = this.sync.writeAuthorityBits(view, this.id);
        if (serialised) actualSize++;

        view.setUint16(index, actualSize);
    }

    writeMessages(view: AutoView) {
        for (const msg of this.messages) {
            Message.write(view, msg);
        }
        this.messages = [];
    }

    private incidentRouter = new IncidentRotuer();

    subscribe<K extends string>(name: K, component: trippable<K>) {
        this.incidentRouter.subscribe(name, component);
    }

    unsubscribe<K extends string>(name: K, component: trippable<K>) {
        this.incidentRouter.unsubscribe(name, component);
    }

    fire(name: string, params?: any) {
        this.incidentRouter.fire(name, params);
    }

    socketClosed() {
        this.incidentRouter.fire("disconnect", this);
        Client.online.delete(this.id);
    }
}
