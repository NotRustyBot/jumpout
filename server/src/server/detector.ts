import { BaseObject } from "@shared/baseObject";
import { SerialisedComponent, Component } from "@shared/component";
import { Client } from "../client";
import { Detectable } from "./detectable";

export type SerialisedDetector = {
    clientIds: Array<number>
}

export type SerialisedDetectorComponent = SerialisedDetector & SerialisedComponent;

export class Detector extends Component {

    static detectors = new Set<Detector>();
    clientIds = new Set<number>();

    clients = new Set<Client>();
    static processAll() {
        for (const detector of this.detectors) {
            detector.detect();
        }
    }

    detect() {

    }

    override init(): void {
        super.init();
        Detector.detectors.add(this);
    }

    override onRemove(): void {
        super.onRemove();
        Detector.detectors.delete(this);
    }


    detected(detectable: Detectable) {
        for (const client of this.clients) {
            client.track(detectable);
        }
    }

    ["disconnect"](client: Client) {
        this.clients.delete(client);
    }

    subscribe(client: Client) {
        this.clients.add(client);
        this.clientIds.add(client.id);
        client.subscribe("disconnect", this);
    }

    unsubscribe(client: Client) {
        this.clients.delete(client);
        client.unsubscribe("disconnect", this);
    }

    private handleResubscription(client: Client) {
        for (const id of this.clientIds) {
            if (client.id == id) {
                this.subscribe(client);
            }
        }
    }

    static subscribeClient(client: Client) {
        for (const detector of this.detectors) {
            detector.handleResubscription(client);
        }
    }

    override toSerialisable(): SerialisedDetectorComponent {
        const data = super.toSerialisable() as SerialisedDetectorComponent;
        data.clientIds = [...this.clientIds];
        return data;
    }

    override fromSerialisable(data: SerialisedDetectorComponent): void {
        super.fromSerialisable(data);
        for (const id of data.clientIds) {
            this.clientIds.add(id);
        }
    }
}

