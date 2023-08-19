import { BaseObject } from "../baseObject";
import { SerialisedComponent, commonDatatype } from "../component";
import { datatype } from "../datagram";
import { NetComponent } from "../netComponent";
import { ObjectScope } from "../objectScope";
import { ShipBehaviour } from "../shipBehaviour";
import { Vectorlike, Vector } from "../types";

export type SerialisedSubControl = {
    vector: Vectorlike,
    submarine: number
}

export type SerialisedSubControlComponent = SerialisedSubControl & SerialisedComponent;

export class SubControl extends NetComponent {
    vector = new Vector();
    submarine!: ShipBehaviour;

    static override datagramDefinition(): void {
        super.datagramDefinition();
        this.datagram = this.datagram.cloneAppend<SerialisedSubControl>({
            vector: datatype.vector32,
            submarine: commonDatatype.compId,
        });
    }

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        ObjectScope.game.subscribe("input", this);
    }

    override onRemove(): void {
        ObjectScope.game.unsubscribe("input", this);
    }

    ["input"](params: any) {
        this.submarine.control.set(this.vector.x, this.vector.y);
        this.invalidateCache();
    }

    override toSerialisable(): SerialisedSubControlComponent {
        const data = super.toSerialisable() as SerialisedSubControlComponent;
        data.vector = this.vector.toLike();
        data.submarine = this.submarine.id;
        return data;
    }

    override fromSerialisable(data: SerialisedSubControlComponent) {
        super.fromSerialisable(data);
        this.vector = Vector.fromLike(data.vector);
        this.submarine = this.parent.getComponent(data.submarine);
    }
}

