import { BaseObject } from "./baseObject";
import { Hitbox } from "./hitbox";
import { ObjectScope } from "./objectScope";
import { Physics } from "./physics";

export class DynamicHitbox extends Hitbox {
    _physics?: Physics;
    dt = 0;
    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        ObjectScope.game.subscribe("collisions", this);
    }

    override onRemove(): void {
        ObjectScope.game.unsubscribe("collisions", this);
        super.onRemove();
    }

    public get physics(): Physics {
        if( this._physics) return this._physics
        this._physics = this.parent.getComponentByType(Physics);
        return this._physics!
    }

    public override get x1(): number {
        return this.position.x + this.offset.x - this.sides.x / 2 + this.physics.velocity.x
    }

    public override get x2(): number {
        return this.position.x + this.offset.x + this.sides.x / 2 + this.physics.velocity.x
    }

    public override get y1(): number {
        return this.position.y + this.offset.y - this.sides.y / 2 + this.physics.velocity.y
    }

    public override get y2(): number {
        return this.position.y + this.offset.y + this.sides.y / 2 + this.physics.velocity.y
    }

    ["collisions"](dt: number) {
        this.dt = dt;
        this.move();
    }
}

