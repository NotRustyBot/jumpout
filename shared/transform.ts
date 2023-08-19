import { NetComponent } from "./netComponent";
import { datatype } from "./datagram";
import { Vector, Vectorlike } from "./types";
import { SerialisedComponent } from "./component";

export type SerialisedTransform = {
    position: Vectorlike;
    rotation: number;
};

export type SerialisedTransformComponent = SerialisedTransform & SerialisedComponent;

export class Transform extends NetComponent {
    position = new Vector();
    rotation = 0;

    static override datagramDefinition(): void {
        super.datagramDefinition();
        this.datagram = this.datagram.cloneAppend<SerialisedTransform>({
            position: datatype.vector32,
            rotation: datatype.float32,
        });
    }

    override toSerialisable(): SerialisedTransformComponent {
        const data = super.toSerialisable() as SerialisedTransformComponent;
        data.position = this.position;
        data.rotation = this.rotation;
        return data;
    }

    override fromSerialisable(data: SerialisedTransformComponent) {
        super.fromSerialisable(data);
        this.position.set(data.position.x, data.position.y);
        this.rotation = data.rotation;
    }
}
