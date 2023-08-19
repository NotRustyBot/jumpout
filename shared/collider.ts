import { ObjectScope } from "./objectScope";
import { BaseObject } from "./baseObject";
import { NetComponent, SerialisedComponent } from "./netComponent";
import { Matrix2x2, Vector, Vectorlike } from "./types";
import { GJK, support } from "./physics/gjk";
import { Physics } from "./physics";

export type SerialisedHitBox = {
    parent: number;
    mobility?: number;
    polygon: Vectorlike[];
}

export type SerialisedHitBoxComponent = SerialisedHitBox & SerialisedComponent

export class Collider extends NetComponent {
    polygon!: Vector[];
    rotated!: Vector[];
    physics?: Physics;
    size: number;

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        this.size = 0;
        Collider.boxes.add(this);
        ObjectScope.game.subscribe("draw", this);
    }

    override toSerialisable(): SerialisedHitBoxComponent {
        const data = super.toSerialisable() as SerialisedHitBoxComponent;
        if (this.physics) data.mobility = this.physics.id;
        data.polygon = this.polygon.map(v => ({ x: v.x, y: v.y }));
        return data;
    }

    override fromSerialisable(data: SerialisedHitBoxComponent) {
        if (data.mobility) {
            this.physics = this.parent.getComponent(data.mobility);
        }
        this.polygon = data.polygon.map(vl => new Vector(vl.x, vl.y));
        this.rotatePolygon(0);
    }

    shift() {
        return this.rotated.map(r => new Vector(r.x + this.parent.position.x, r.y + this.parent.position.y));
    }
    //Implementation of GJK algorithm https://www.youtube.com/watch?v=ajv46BSqcK4
    checkCollision(hitbox: Collider): CollisionResult {
        const simplex = GJK(this, hitbox);
        if (simplex == undefined) return new CollisionResult(false);
        let minima = Infinity;
        let nearestLine = new Vector();
        for (let i = 0; i < simplex.length; i++) {
            const lenght = Vector.distanceToLine(simplex[i], simplex[(i + 1) % simplex.length], new Vector());
            const near = nearest(new Vector(), simplex[i], simplex[(i + 1) % simplex.length]);

            if (Vector.dot(near, this.parent.position.diff(hitbox.parent.position)) < 0) continue;
            if (lenght < minima) {
                minima = lenght;
                nearestLine.add(near);
            }
        }
        if (nearestLine == undefined) throw "how"
        return new CollisionResult(true, new Vector(-nearestLine.x, -nearestLine.y), this.parent.position.result().add(nearestLine), this, hitbox);
    }

    static boxes = new Set<Collider>();
    ["draw"](params: any) {
        this.rotatePolygon(this.parent.rotation);
        for (const other of Collider.boxes) {
            if (other == this) continue;
            other.rotatePolygon(other.parent.rotation);
            const result = this.checkCollision(other);
            if (result.hit) {
                console.log(result);
                if (other.physics) other.physics.bounce();
                if (this.physics) this.physics.bounce();

                //this.parent.position.sub(result.overlap!);
                //console.log(JSON.stringify(ObjectScope.get(0)!.toDeepSerialisable()));
            }
        }
    }

    /**
     * @param {Vector} from
     * @param {Vector} to
     * @returns {boolean | Vector} false or hit position
     */
    rayCast(from: Vector, to: Vector): boolean | Vector {
        throw new Error("not implemented");
    }

    /**
     * @param {Vector[]} polygon
     * @returns {number} side of smallest AABB that the polygon can always fit
     */
    static getSize(polygon: Vector[]): number {
        let max = 0;
        polygon.forEach(vertex => {
            let length = vertex.length();
            max = length > max ? length : max;
        });
        return max;
    }

    /**
     * @param {number} angle
     */
    rotatePolygon(angle: number) {
        let matrix = Matrix2x2.fromAngle(angle);
        this.rotated = [];
        this.polygon.forEach(vertex => {
            this.rotated.push(matrix.transform(vertex));
        });
    }
}

export class CollisionResult {
    hit: boolean;
    overlap?: Vector;
    position?: Vector;
    object1?: Collider;
    object2?: Collider;
    constructor(hit: boolean, overlap?: Vector, position?: Vector, object1?: Collider, object2?: Collider) {
        this.hit = hit;
        this.overlap ??= overlap;
        this.position ??= position;
        this.object1 ??= object1;
        this.object2 ??= object2;
    }
}



export function nearest(p: Vectorlike, a: Vectorlike, b: Vectorlike) {
    const atob = new Vector(b.x - a.x, b.y - a.y);
    const atop = new Vector(p.x - a.x, p.y - a.y);
    const len = atob.lengthSquared();
    let dot = Vector.dot(atop, atob);
    const t = Math.min(1, Math.max(0, dot / len));


    return { x: a.x + (atob.x * t), y: a.y + (atob.y * t) };
}