import { BaseObject } from "@shared/baseObject";
import { Physics } from "@shared/physics";
import { ObjectScope } from "@shared/objectScope";
import { PhysicsDrawable as MockPhysicsDrawable } from "@shared/mock/physicsDrawable";
import { Sprite, Texture } from "pixi.js";
import { addChildByType, entityLayer } from "./index";
import { rLerp } from "@shared/utils";

export class PhysicsDrawable extends MockPhysicsDrawable {
    sprite!: Sprite;
    dsprite!: Sprite;
    lastPhysicsCacheId = 0;

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        ObjectScope.game.subscribe("draw", this);
        ObjectScope.game.subscribe("update", this);
    }

    override onRemove(): void {
        super.onRemove();
        ObjectScope.game.unsubscribe("draw", this);
        ObjectScope.game.unsubscribe("update", this);
        this.sprite.destroy();
        this.dsprite.destroy();
    }

    static override initialise(): void {
        super.initialise();
    }

    ["draw"](dt: number) {
        this.sprite.position.x += this.physics.velocity.x * dt;
        this.sprite.position.y += this.physics.velocity.y * dt;
        this.sprite.rotation += this.physics.rotation * dt;
    }

    override init() {
        this.dsprite = Sprite.from(this.url);
        this.dsprite.anchor.set(0.5);
        this.dsprite.tint = 0x5599ff;
        this.dsprite.alpha = 0.5;
        addChildByType(this.dsprite, this.extra);

        this.sprite = Sprite.from(this.url);
        this.sprite.anchor.set(0.5);
        addChildByType(this.sprite, this.extra);
    }

    ["update"](dt: number) {
        if (this.physics.cacheId == this.lastPhysicsCacheId) return;
        this.lastPhysicsCacheId = this.physics.cacheId;
        this.dsprite.position.set(...this.parent.position.xy());
        this.dsprite.rotation = this.parent.rotation;
        const diff = this.parent.position.diff(this.sprite.position);
        this.sprite.position.x += diff.x * 0.1 * dt;
        this.sprite.position.y += diff.y * 0.1 * dt;
        this.sprite.rotation = rLerp(this.sprite.rotation, this.parent.rotation, 0.1 * dt);
    }

    override fromSerialisable(data: any) {
        super.fromSerialisable(data);
        if (this.sprite) Texture.fromURL(this.url).then((texture) => (this.sprite.texture = texture));
        if (this.dsprite) Texture.fromURL(this.url).then((texture) => (this.dsprite.texture = texture));
    }
}
