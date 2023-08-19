import { Vector, Vectorlike } from "../types";
import { BaseObject } from "../baseObject";

export type RectWithParent = { position: Vector; x1: number; y1: number; x2: number; y2: number; parent: BaseObject };

//#region server
export class Layer {
    static list = new Map<number, Layer>();
    static index = 0;
    areas: Map<number, Area>;
    id: number;
    size = 1000;
    constructor() {
        this.areas = new Map();
        this.id = Layer.index;
        Layer.list.set(Layer.index++, this);
    }

    static getById(id: number): Layer {
        const layer = this.list.get(id);
        if (layer) return layer;
        throw "no layer with this id";
    }

    addObject(rect: RectWithParent, areas: Set<Area>) {
        for (let x = this.toGridAxis(rect.x1); x <= this.toGridAxis(rect.x2); x++) {
            for (let y = this.toGridAxis(rect.y1); y <= this.toGridAxis(rect.y2); y++) {
                let gridCoords = { x, y };
                let gridIndex = Layer.toGridIndex(gridCoords);
                let area = this.areas.get(gridIndex);
                if (!area) {
                    area = new Area(this, gridCoords);
                    this.areas.set(gridIndex, area);
                }
                area.members.add(rect);
                areas.add(area);
            }
        }
    }

    removeObject(physicsObject: RectWithParent, fromAreas: Set<Area>) {
        for (const area of fromAreas) {
            if (area.layer == this) area.members.delete(physicsObject);
            fromAreas.delete(area);
        }
    }

    getObjects(position: Vectorlike) {
        return this.getObjectsByGrid(this.toGrid(position));
    }

    getObjectsByGrid(grid: Vectorlike) {
        let area = this.areas.get(Layer.toGridIndex(grid));
        if (area == undefined) return new Set<RectWithParent>();
        return area.members;
    }

    getNearbyObjects(position: Vector, range: Vectorlike) {
        const result: Array<Set<RectWithParent>> = [];
        for (let x = this.toGridAxis(position.x - range.x); x <= this.toGridAxis(position.x + range.x); x++) {
            for (let y = this.toGridAxis(position.y - range.y); y <= this.toGridAxis(position.y + range.y); y++) {
                result.push(this.getObjectsByGrid({ x, y }));
            }
        }
        return result;
    }

    getRelevantObjects(rect: RectWithParent) {
        const result: Array<Set<RectWithParent>> = [];
        for (let x = this.toGridAxis(rect.x1); x <= this.toGridAxis(rect.x2); x++) {
            for (let y = this.toGridAxis(rect.y1); y <= this.toGridAxis(rect.y2); y++) {
                result.push(this.getObjectsByGrid({ x, y }));
            }
        }
        return result;
    }

    moveObject(rect: RectWithParent, position: Vector, areas: Set<Area>) {
        const orig = rect.position;
        const offset = position.diff(orig);
        let updateRequired =
            this.toGridAxis(rect.x1) != this.toGridAxis(rect.x1 + offset.x) ||
            this.toGridAxis(rect.y1) != this.toGridAxis(rect.y1 + offset.y) ||
            this.toGridAxis(rect.x2) != this.toGridAxis(rect.x2 + offset.x) ||
            this.toGridAxis(rect.y2) != this.toGridAxis(rect.y2 + offset.y);

        if (updateRequired) {
            this.removeObject(rect, areas);
            rect.position.set(position.x, position.y);
            this.addObject(rect, areas);
        } else {
            rect.position.set(position.x, position.y);
        }
    }

    toGridAxis(scalar: number): number {
        return Math.floor(scalar / this.size);
    }

    toGrid(position: Vectorlike): Vector {
        return new Vector(this.toGridAxis(position.x), this.toGridAxis(position.y));
    }

    static toGridIndex(vector: Vectorlike): number {
        return ((vector.x & 0xffff) << 16) | (vector.y & 0xffff);
    }
}

export class Area {
    members: Set<RectWithParent> = new Set();
    gridPosition: Vector;
    positionIndex: number;
    layer: Layer;
    constructor(layer: Layer, position: Vectorlike) {
        this.gridPosition = new Vector(position.x, position.y);
        this.positionIndex = Layer.toGridIndex(this.gridPosition);
        this.layer = layer;
        layer.areas.set(this.positionIndex, this);
    }

    addObject(physicsObject: RectWithParent) {
        this.members.add(physicsObject);
    }

    removeObject(physicsObject: RectWithParent) {
        this.members.delete(physicsObject);
    }
}

//#endregion server
