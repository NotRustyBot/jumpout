import { BaseObject } from "../baseObject";
import { SerialisedComponent, commonDatatype } from "../component";
import { datatype } from "../datagram";
import { NetComponent } from "../netComponent";

export type SerialisedMarker = {
    range: number;
    tint: number;
    name: string;
};

export type SerialisedMarkerComponent = SerialisedMarker & SerialisedComponent;

export class Marker extends NetComponent {
    range = 0;
    tint = 0xffffff;
    name = "";

    static override datagramDefinition(): void {
        super.datagramDefinition();
        this.datagram = this.datagram.cloneAppend<SerialisedMarker>({
            name: datatype.string,
            range: datatype.float32,
            tint: commonDatatype.color,
        });
        this.cacheSize = 2 * 32;
    }

    override toSerialisable(): SerialisedMarkerComponent {
        const data = super.toSerialisable() as SerialisedMarkerComponent;
        data.range = this.range;
        data.tint = this.tint;
        data.name = this.name;
        return data;
    }

    override fromSerialisable(data: SerialisedMarkerComponent) {
        super.fromSerialisable(data);
        this.range = data.range;
        this.tint = data.tint;
        this.name = data.name;
    }
}
