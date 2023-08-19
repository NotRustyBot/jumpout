import { BaseObject } from "@shared/baseObject";
import { SerialisedComponent, Component } from "@shared/component";
import { ObjectScope } from "@shared/objectScope";
import { Sync } from "@shared/sync";

export type SerialisedDetectable = {
    sync: number;
};

export type SerialisedDetectableComponent = SerialisedDetectable & SerialisedComponent;

export class Detectable extends Component {
    constructor(parent: BaseObject, id: number) {
        super(parent, id);
    }

    private _netId: number = undefined;

    public get netId(): number {
        if (!this._netId) this._netId = this.parent.getId(ObjectScope.network);
         return this._netId;
    }

    sync: Sync;

    override init(): void {
        super.init();
        this.sync = this.parent.getComponentByType(Sync);
    }

    override onRemove(): void {
        super.onRemove();
        this._netId = this.parent.getId(ObjectScope.network);
    }
}
