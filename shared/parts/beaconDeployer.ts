import { BaseObject } from "../baseObject";
import { SubmarinePart, partTypes } from "../common";
import { Part, SerialisedPartComponent } from "./part";

export type SerialisedBeaconDeployerPart = {};

export type SerialisedBeaconDeployerPartComponent = SerialisedBeaconDeployerPart & SerialisedPartComponent;

export class BeaconDeployerPart extends Part {
    static override partType = partTypes.beaconDeployer;

    static override datagramDefinition(): void {
        super.datagramDefinition();
        this.datagram = this.datagram.cloneAppend<SerialisedBeaconDeployerPart>({});
        this.cacheSize = 0;
    }

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        this.part = SubmarinePart.get(partTypes.beaconDeployer);
    }

    override onRemove(): void {
        this.submarine.commands.unsubscribe("deploy-beacon", this);
    }

    override init(): void {
        super.init();
        this.submarine.commands.subscribe("deploy-beacon", this);
    }

    ["deploy-beacon"](...params: any) {

    }


    override toSerialisable(): SerialisedBeaconDeployerPartComponent {
        const data = super.toSerialisable() as SerialisedBeaconDeployerPartComponent;
        return data;
    }

    override fromSerialisable(data: SerialisedBeaconDeployerPartComponent) {
        super.fromSerialisable(data);
    }
}
