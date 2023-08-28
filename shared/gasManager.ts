import { Vectorlike } from "./types";

export class GasManager {
    static gasScale = 500;
    protected level = new Map<number, number>();

    setWorld(vector: Vectorlike, value: number) {
        this.setGas(GasManager.worldToGas(vector), value);
    }

    getWorld(vector: Vectorlike) {
        return this.getGas(GasManager.worldToGas(vector));
    }

    setGas(vector: Vectorlike, value: number) {
        this.level.set(GasManager.gasToIndex(vector), value);
    }

    getGas(vector: Vectorlike) {
        return this.level.get(GasManager.gasToIndex(vector)) ?? 0;
    }

    getIndex(index: number) {
        return this.level.get(index) ?? 0;
    }

    setIndex(index: number, value: number) {
        this.level.set(index, value);
    }

    static worldToGas(vector: Vectorlike) {
        vector.x = Math.round(vector.x / this.gasScale);
        vector.y = Math.round(vector.y / this.gasScale);
        return vector;
    }

    static gasToIndex(vector: Vectorlike): number {
        return ((vector.x & 0xffff) << 16) | (vector.y & 0xffff);
    }

    static worldToIndex(vector: Vectorlike): number {
        vector.x = Math.round(vector.x / this.gasScale);
        vector.y = Math.round(vector.y / this.gasScale);
        return ((vector.x & 0xffff) << 16) | (vector.y & 0xffff);
    }
}
