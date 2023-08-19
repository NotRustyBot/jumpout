import { HandshakeReply, HandshakeRequest, NetManager, headerId } from "@shared/netManager";
import { AutoView } from "@shared/datagram";
import { Sync } from "@shared/sync";
import { Message, messageType, netMessage } from "@shared/messages";
import { ServerInfo } from "@shared/serverInfo";
import { ObjectScope } from "@shared/objectScope";
import { time } from "index";

export class Network {
    static websocket: WebSocket;
    static server = "ws://10.200.140.14";
    static port = 1500;
    static ready = false;
    static autoview = new AutoView(new ArrayBuffer(1000));
    static secret = "";
    static tempAuthority: Array<Sync> = [];
    /**netId -> gameId*/
    static objectLinks = new Map<number, number>();
    static sendCount = 0;
    static start() {
        NetManager.identity = parseInt(localStorage.getItem("sun_identity") ?? "0");
        this.secret = localStorage.getItem("sun_secret") ?? NetManager.makeId(32);
        localStorage.setItem("sun_secret", this.secret);
        this.websocket = new WebSocket(`${this.server}:${this.port}`);
        this.websocket.binaryType = "arraybuffer";
        this.websocket.addEventListener("open", (e) => {
            this.autoview.index = 0;
            this.autoview.writeUint16(headerId.handshake);
            NetManager.connectRequest.serialise<HandshakeRequest>(this.autoview, {
                clientId: NetManager.identity,
                secret: this.secret,
            });
            this.send();
        });
        this.websocket.addEventListener("message", this.parseMessage);
    }

    static parseMessage(message: any) {
        const view = new AutoView(message.data);
        while (view.index < view.buffer.byteLength) {
            const packetType = view.readUint16() as headerId;
            switch (packetType) {
                case headerId.handshake:
                    const result = NetManager.connectReply.deserealise<HandshakeReply>(view);
                    console.log(result.response);
                    console.log(result.motd);
                    NetManager.identity = result.clientId;
                    localStorage.setItem("sun_identity", NetManager.identity.toString());
                    break;
                case headerId.objects:
                    const count = view.readUint16();
                    for (let i = 0; i < count; i++) {
                        Sync.resolveBits(view, Network.objectLinks);
                    }

                    if (Network.objectLinks.size != 0) {
                        console.warn(`Removing stale ${Network.objectLinks.size} links.`);
                        Network.objectLinks.clear();
                    }
                    break;
                case headerId.message:
                    const msg = Message.read(view);
                    Network.handleMessage(msg);
                    break;
            }
        }
    }

    static handleMessage(msg: netMessage) {
        switch (msg.typeId) {
            case messageType.tick:
                ServerInfo.get().tick = 1;
                break;
            case messageType.untrackObject:
                {
                    const toUntrack = ObjectScope.network.getObject(msg.objectId);
                    toUntrack.remove();
                }
                break;

            case messageType.objectLink:
                {
                    this.objectLinks.set(msg.netId, msg.linkId);
                }
                break;

            case messageType.actionFailed:
                {
                    console.warn(msg.text);
                }
                break;

            case messageType.actionFailedLinked:
                {
                    ObjectScope.game.getObject(msg.linkId).remove();
                    console.warn(msg.text);
                }
                break;
        }
    }

    private static messages = new Array<netMessage>();
    static message(msg: netMessage) {
        this.messages.push(msg);
    }

    static send() {
        if (this.websocket.readyState != this.websocket.OPEN) return;
        this.websocket.send(this.autoview.buffer.slice(0, this.autoview.index));
        this.autoview.index = 0;
        this.sendCount++;
    }

    static sendMessages() {
        for (const msg of this.messages) {
            Message.write(Network.autoview, msg);
        }
        this.messages = [];
    }

    static sendObjects() {
        Network.autoview.writeUint16(headerId.objects);
        const bindex = Network.autoview.index;
        Network.autoview.writeUint16(0);

        for (const nc of Network.tempAuthority) {
            nc.writeAllBits(Network.autoview);
        }

        let actualSize = 0;
        for (const nc of Sync.localAuthority) {
            if (nc.writeAuthorityBits(Network.autoview, 0)) {
                actualSize++;
            }
        }

        Network.autoview.setUint16(bindex, Network.tempAuthority.length + actualSize);
        Network.tempAuthority = [];

        this.send();
    }
}

NetManager.initDatagrams();
