import { BaseObject } from "@shared/baseObject";
import { SerialisedComponent } from "@shared/component";
import { Detectable } from "./detectable";
import { ObjectScope } from "@shared/objectScope";
import { Area, Layer, RectWithParent } from "@shared/physics/chunks";
import { physicsLayerEnum, physicsLayers } from "../main";
import { Vector } from "@shared/types";

export type SerialisedMarkerDetectable = {
    range: number;
};

export type SerialisedMarkerDetectableComponent = SerialisedMarkerDetectable & SerialisedComponent;

export class MarkerDetectable extends Detectable implements RectWithParent {
    position = new Vector();
    range = 0;
    public get x1(): number {
        return this.position.x - this.range;
    }

    public get x2(): number {
        return this.position.x + this.range;
    }

    public get y1(): number {
        return this.position.y - this.range;
    }

    public get y2(): number {
        return this.position.y + this.range;
    }

    inAreas = new Set<Area>();
    private static lookup = new Map<BaseObject, MarkerDetectable>();

    static getByParent(baseobject: BaseObject) {
        return this.lookup.get(baseobject);
    }

    override init(): void {
        super.init();
        MarkerDetectable.lookup.set(this.parent, this);
        ObjectScope.game.subscribe("post-collision", this);
        this.position = this.parent.position.result();
        physicsLayers[physicsLayerEnum.marker].addObject(this, this.inAreas);
    }

    ["post-collision"](dt: number) {
        physicsLayers[physicsLayerEnum.marker].moveObject(this, this.parent.position, this.inAreas);
    }

    override onRemove(): void {
        super.onRemove();
        MarkerDetectable.lookup.delete(this.parent);
        ObjectScope.game.unsubscribe("post-collision", this);
    }

    override fromSerialisable(data: SerialisedMarkerDetectableComponent): void {
        super.fromSerialisable(data);
        this.range = data.range;
    }

    override toSerialisable(): SerialisedMarkerDetectableComponent {
        const data = super.toSerialisable() as SerialisedMarkerDetectableComponent;
        data.range = this.range;
        return data;
    }
}
