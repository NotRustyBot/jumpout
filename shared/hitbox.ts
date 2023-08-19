import { Area, Layer, RectWithParent } from "./physics/chunks";
import { Vector, Vectorlike } from "./types";
import { BaseObject } from "./baseObject";
import { Datagram, datatype } from "./datagram";
import { NetComponent } from "./netComponent";
import { SerialisedComponent } from "./component";

export type SerialisedHitbox = {
    x: number;
    y: number;
    w: number;
    h: number;
    peek: Array<{ id: number }>;
    poke: Array<{ id: number }>;
};
export type SerialisedHitboxComponent = SerialisedHitbox & SerialisedComponent;

export type Overlap = {
    offset: Vectorlike;
    with: RectWithParent;
};

export class Hitbox extends NetComponent {
    boundOffsets: Array<Vectorlike> = [];
    size = 0;
    sides = new Vector();
    offset = new Vector();
    overlaps = new Map<Layer, Array<Overlap>>();
    position = new Vector();

    peek: Array<Layer> = [];
    poke: Array<Layer> = [];

    pokeAreas = new Set<Area>();

    public get x1(): number {
        return this.position.x + this.offset.x - this.sides.x / 2;
    }

    public get x2(): number {
        return this.position.x + this.offset.x + this.sides.x / 2;
    }

    public get y1(): number {
        return this.position.y + this.offset.y - this.sides.y / 2;
    }

    public get y2(): number {
        return this.position.y + this.offset.y + this.sides.y / 2;
    }

    static override datagramDefinition(): void {
        this.datagram = this.datagram.cloneAppend<SerialisedHitbox>({
            x: datatype.float32,
            y: datatype.float32,
            w: datatype.float32,
            h: datatype.float32,
            peek: [datatype.array, new Datagram().addField("id", datatype.uint8)],
            poke: [datatype.array, new Datagram().addField("id", datatype.uint8)],
        });

        this.cacheSize = 32;
    }

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
    }

    override onRemove(): void {
        for (const layer of this.poke) {
            layer.removeObject(this, this.pokeAreas);
        }
    }

    move() {
        for (const layer of this.poke) {
            layer.moveObject(this, this.parent.position.result(), this.pokeAreas);
        }
        this.position.set(this.parent.position.x, this.parent.position.y);
        this.checkCollisions();
        this.invalidateCache();
    }

    checkCollisions() {
        for (const layer of this.peek) {
            //#perf???
            this.overlaps.set(layer, []);
            const areas = layer.getRelevantObjects(this);
            const toCheck = new Set<RectWithParent>();
            for (const members of areas) {
                for (const box of members) {
                    if (box == this) continue;
                    toCheck.add(box);
                }
            }

            for (const box of toCheck) {
                this.checkAgainst(box, layer);
            }
        }
    }

    checkAgainst(that: RectWithParent, layer: Layer) {
        const small_epsilon = 0;
        if (this.x1 < that.x2 && this.x2 > that.x1 && this.y1 < that.y2 && this.y2 > that.y1) {
            const dx = Math.min(this.x2, that.x2) - Math.max(this.x1, that.x1);
            const dy = Math.min(this.y2, that.y2) - Math.max(this.y1, that.y1);
            const offset = new Vector();
            offset.x = dx > 0 ? dx + small_epsilon : 0;
            offset.y = dy > 0 ? dy + small_epsilon : 0;

            offset.x *= this.x2 < that.x2 ? -1 : 1;
            offset.y *= this.y2 < that.y2 ? -1 : 1;

            this.overlaps.get(layer).push({ offset, with: that });
        }
    }

    isCoordInside(coord: Vectorlike) {
        if (this.x1 / 2 > coord.x) return false;
        if (this.x2 / 2 < coord.x) return false;
        if (this.y1 / 2 > coord.y) return false;
        if (this.y2 / 2 < coord.y) return false;
        return true;
    }

    updateBounds() {
        this.boundOffsets[0] = { x: this.sides.x / 2 + this.offset.x, y: this.sides.y / 2 + this.offset.y };
        this.boundOffsets[1] = { x: this.sides.x / 2 + this.offset.x, y: -this.sides.y / 2 + this.offset.y };
        this.boundOffsets[2] = { x: -this.sides.x / 2 + this.offset.x, y: -this.sides.y / 2 + this.offset.y };
        this.boundOffsets[3] = { x: -this.sides.x / 2 + this.offset.x, y: this.sides.y / 2 + this.offset.y };

        this.size = 0;
        for (let i = 0; i < this.boundOffsets.length; i++) {
            const point = this.boundOffsets[i];
            this.size = Math.max(this.size, Vector.fromLike(point).length());
        }

        this.invalidateCache();
    }

    override toSerialisable(): SerialisedHitboxComponent {
        const data = super.toSerialisable() as SerialisedHitboxComponent;
        data.x = this.offset.x;
        data.y = this.offset.y;
        data.w = this.sides.x;
        data.h = this.sides.y;
        data.peek = this.peek.map((o) => ({ id: o.id }));
        data.poke = this.poke.map((o) => ({ id: o.id }));
        return data;
    }

    override fromSerialisable(data: SerialisedHitboxComponent): void {
        super.fromSerialisable(data);
        this.offset.set(data.x, data.y);
        this.sides.set(data.w, data.h);
        this.peek = data.peek.map((o) => Layer.getById(o.id));
        this.poke = data.poke.map((o) => Layer.getById(o.id));
        this.init();
    }

    override init(): void {
        this.position = this.parent.position.result();

        for (const layer of this.peek) {
            this.overlaps.set(layer, []);
        }

        for (const layer of this.poke) {
            layer.addObject(this, this.pokeAreas);
        }

        this.updateBounds();
        this.move();
    }
}
