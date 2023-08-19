import { SerialisedComponent, commonDatatype } from "./component";
import { NetComponent } from "./netComponent";

export type SerialisedClientData = {
    userId: number;
};

type FileClientData = {
    secret: string;
}

export type SerialisedClientDataComponent = SerialisedClientData & SerialisedComponent;
export type SerialisedFileClientDataComponent = SerialisedClientDataComponent & FileClientData;

export class ClientData extends NetComponent {
    static list = new Map<number, ClientData>();
    userId: number;
    secret: string;

    static override datagramDefinition(): void {
        super.datagramDefinition();

        this.datagram = this.datagram.cloneAppend<SerialisedClientData>({
            userId: commonDatatype.userId,
        });

        this.cacheSize = 10000;
    }
    override init(): void {
        ClientData.list.set(this.userId, this);
    }

    override onRemove(): void {
        ClientData.list.delete(this.userId);
    }

    override toSerialisable(): SerialisedFileClientDataComponent {
        const data = super.toSerialisable() as SerialisedFileClientDataComponent;
        data.userId = this.userId;
        data.secret = this.secret;
        return data;
    }

    override fromSerialisable(data: SerialisedFileClientDataComponent) {
        super.fromSerialisable(data);
        this.userId = data.userId;
        this.secret = data.secret;
    }
}
