import { Vector, Vectorlike } from "./types";
import { SubStats, SubStatsData } from "./stats";
import { BaseObject } from "./baseObject";
import { Physics } from "./physics";
import { Hitbox } from "./hitbox";
import { clamp } from "./utils";
import { Datagram, datatype } from "./datagram";
import { ObjectScope } from "./objectScope";
import { SerialisedComponent, commonDatatype } from "./component";
import { NetComponent } from "./netComponent";
import { IncidentRotuer } from "./incident";

export type SerialisedShipBehaviour = {
    physics: number;
    hitbox: number;
    ballastWater: number;
    leakWater: number;
    leaking: number;
    owner: number;
    battery: number;
    control: Vectorlike;
};

export type SerialisedShipBehaviourComponent = SerialisedShipBehaviour & SerialisedComponent;

export class ShipBehaviour extends NetComponent {
    control = new Vector();
    physics!: Physics;
    hitbox!: Hitbox;
    cargoWeight = 0;
    stats = new SubStats({ engine: 50, roughness: 0.01, rotationSpeed: 1 });
    battery = Infinity;
    owner = 0;

    commands = new IncidentRotuer();

    public get totalWeight(): number {
        return this.cargoWeight + this.stats.weight;
    }

    static override datagramDefinition(): void {
        super.datagramDefinition();
        this.datagram = this.datagram.cloneAppend<SerialisedShipBehaviour>({
            ballastWater: datatype.float32,
            control: datatype.vector32,
            hitbox: datatype.uint8,
            leakWater: datatype.float32,
            physics: datatype.uint8,
            leaking: datatype.float32,
            owner: commonDatatype.userId,
            battery: datatype.float32,
        });
        this.cacheSize;
    }

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        ObjectScope.game.subscribe("update", this);
        ObjectScope.game.subscribe("post-collision", this);
    }

    override onRemove(): void {
        ObjectScope.game.unsubscribe("update", this);
        ObjectScope.game.unsubscribe("post-collision", this);
    }

    ["update"](dt: number) {
        const s = dt / 60;
        if (this.control.x != 0) {
            this.physics.rotation = this.control.x * s * this.stats.rotationSpeed;
        } else {
            this.physics.rotation = 0;
        }

        this.physics.velocity.add(Vector.fromAngle(this.parent.rotation).mult(this.control.y * this.stats.engine * s));

        this.drag();
        this.updateControl();
        this.battery = clamp(0, this.stats.battery, this.battery);
        this.invalidateCache();
    }

    ["post-collision"](dt: number) {
        for (const [layer, overlaps] of this.hitbox.overlaps) {
            for (const overlap of overlaps) {
                let useOffset = new Vector();
                if (Math.abs(overlap.offset.x) > Math.abs(overlap.offset.y)) {
                    useOffset.y = overlap.offset.y;
                    this.physics.velocity.y = 0;
                } else {
                    useOffset.x = overlap.offset.x;
                    this.physics.velocity.x = 0;
                }
                this.parent.position.add(useOffset);
                this.parent.transform.invalidateCache();
            }
        }
        this.invalidateCache();
    }

    drag() {
        this.physics.velocity.x -= this.physics.velocity.x * this.stats.drag;
        this.physics.velocity.y -= this.physics.velocity.y * this.stats.drag;
    }

    updateControl() {}

    override fromSerialisable(data: SerialisedShipBehaviourComponent): void {
        super.fromSerialisable(data);
        this.owner = data.owner;
        this.battery = data.battery;
        this.physics = this.parent.getComponent(data.physics);
        this.hitbox = this.parent.getComponent(data.hitbox);
        this.control = Vector.fromLike(data.control);
    }

    override toSerialisable(): SerialisedShipBehaviourComponent {
        const data = super.toSerialisable() as SerialisedShipBehaviourComponent;
        data.physics = this.physics.id;
        data.hitbox = this.hitbox.id;
        data.owner = this.owner;
        data.battery = this.battery;
        data.control = this.control.toLike();
        return data;
    }
}
