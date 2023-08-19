import { datatype } from "../datagram";
import { BaseObject } from "../baseObject";
import { Physics } from "../physics";
import { SerialisedComponent, commonDatatype } from "../component";
import { NetComponent } from "../netComponent";


export type SerialisedPhysicsDrawable = {
    physics: number;
    url: string;
    extra: number;

}

export type SerialisedPhysicsDrawableComponent = SerialisedPhysicsDrawable & SerialisedComponent;

export class PhysicsDrawable extends NetComponent {
    physics!: Physics;
    url!: string;
    extra!: number;

    static override datagramDefinition(): void {
        this.datagram = super.datagram.cloneAppend<SerialisedPhysicsDrawable>({
            physics: commonDatatype.compId,
            url: datatype.string,
            extra: datatype.uint8

        });
        this.cacheSize = 2 * 64;
    }

    override toSerialisable(): SerialisedPhysicsDrawableComponent {
        const data = super.toSerialisable() as SerialisedPhysicsDrawableComponent;
        data.physics = this.physics.id;
        data.url = this.url;
        data.extra = this.extra;
        return data;
    }

    override fromSerialisable(data: SerialisedPhysicsDrawableComponent) {
        super.fromSerialisable(data);
        this.physics = this.parent.getComponent(data.physics);
        this.url = data.url;
        this.extra = data.extra;
    }
}

