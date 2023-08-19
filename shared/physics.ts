import { BaseObject } from "./baseObject";
import { Vector } from "./types";
import { Template, datatype } from "./datagram";
import { ObjectScope } from "./objectScope";
import { SerialisedComponent } from "./component";
import { NetComponent } from "./netComponent";

export type SerialisedPhysics = {
    x: number;
    y: number;
    r: number;
};

export type SerialisedPhysicsComponent = SerialisedPhysics & SerialisedComponent;

export class Physics extends NetComponent {
    velocity: Vector = new Vector();
    rotation = 0;

    static override datagramDefinition(): void {
        super.datagramDefinition();
        this.datagram = this.datagram.cloneAppend<SerialisedPhysics>({
            x: datatype.float32,
            y: datatype.float32,
            r: datatype.float32,
        });
    }

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        ObjectScope.game.subscribe("physics", this);
    }

    override onRemove(): void {
        ObjectScope.game.unsubscribe("physics", this);
    }

    override toSerialisable(): SerialisedPhysicsComponent {
        const data = super.toSerialisable() as SerialisedPhysicsComponent;
        data.x = this.velocity.x;
        data.y = this.velocity.y;
        data.r = this.rotation;
        return data;
    }

    override fromSerialisable(data: SerialisedPhysicsComponent) {
        super.fromSerialisable(data);
        this.velocity.x = data.x;
        this.velocity.y = data.y;
        this.rotation = data.r;
    }

    bounce() {
        this.parent.position.sub(this.velocity);
        this.velocity.mult(-0.5);
    }

    ["physics"](dt: number) {
        this.parent.position.add(this.velocity.result().mult(dt));
        this.parent.rotation += this.rotation * dt;
        this.invalidateCache();
        this.parent.transform.invalidateCache();
    }
}
