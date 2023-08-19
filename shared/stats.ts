import { SubmarineAssembly } from "./common";

export type SubStatsData = Partial<SubStats>;

export class SubStats {
    weight = 1;
    engine = 1;
    roughness = 0.1;
    space = 0;
    battery = 0;
    ballastPumpCost = 0;
    engineCost = 0;
    passiveDraw = 0;
    rotationSpeed = 1;


    constructor(data: SubStatsData) {
        Object.assign(this, data);
    }



    topSpeed() {
        return this.engine / this.drag / this.weight;
    }

    
    public get drag() : number {
        return this.roughness
    }
    


    addAssembly(assembly: SubmarineAssembly) {
        const other = assembly.part.modification;
        return this.addProperties(other, assembly.count)
    }

    addProperties(other: SubStats, count = 1){
        this.weight += other.weight * count;
        this.engine += other.engine * count;
        this.roughness += other.roughness * count;
        this.space += other.space * count;
        this.battery += other.battery * count;
        this.ballastPumpCost += other.ballastPumpCost * count;
        this.engineCost += other.engineCost * count;
        this.passiveDraw += other.passiveDraw * count;
        return this;
    }

}
