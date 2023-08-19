import { SerialisedComponent, Component } from "@shared/component";
import { Client } from "../client";
import { ObjectScope } from "@shared/objectScope";
import { clientGasManager } from "./gasHandler";

export type SerialisedGasChecker = {
    range: number
}

export type SerialisedGasCheckerComponent = SerialisedGasChecker & SerialisedComponent;

export class GasChecker extends Component {
    range: number;

    override init(): void {
        super.init();
        ObjectScope.game.subscribe("update", this);
    }

    override onRemove(): void {
        super.onRemove();
        ObjectScope.game.unsubscribe("update", this);

    }

    ["update"](){
        clientGasManager.checkGas(this.parent.position.result(), this.range);
    }

    override toSerialisable(): SerialisedGasCheckerComponent {
        const data = super.toSerialisable() as SerialisedGasCheckerComponent;
        data.range = this.range;
        return data;
    }

    override fromSerialisable(data: SerialisedGasCheckerComponent): void {
        super.fromSerialisable(data);
        this.range = data.range;
    }
}

