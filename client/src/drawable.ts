
import { Container, Sprite, Texture } from "pixi.js";
import { Drawable as MockDrawable } from "@shared/mock/drawable";
import { BaseObject } from "@shared/baseObject";
import { ObjectScope } from "@shared/objectScope";
import { addChildByType } from "./index";


export class Drawable extends MockDrawable {
    sprite!: Sprite;

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        ObjectScope.game.subscribe("draw", this);
    }

    override onRemove(): void {
        ObjectScope.game.unsubscribe("draw", this);
        this.sprite.destroy();
    }

    override init() {
        this.sprite = Sprite.from(this.url);
        this.sprite.anchor.set(0.5);
        addChildByType(this.sprite, this.extra);
    }

    ["draw"](params?: any) {
        this.sprite.position.set(...this.parent.position.xy());
        this.sprite.rotation = this.parent.rotation;
    }

    override fromSerialisable(data: any) {
        super.fromSerialisable(data);
        if(this.sprite) Texture.fromURL(this.url).then(texture => this.sprite.texture = texture);
    }

}
