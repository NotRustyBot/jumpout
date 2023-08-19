import { SubmarinePart, partSlot, partTypes } from "./common";
import { SubStats } from "./stats";

export function defineParts() {
    SubmarinePart.create({
        type: partTypes.beaconDeployer,
        name: "Beacon deployer",
        desc: "Deploys a beacon",
        slot: partSlot.system,
        strain: 1,
        modification: new SubStats({ space: -1, weight: 0.2 }),
        actions: [{image: "/assets/beacon.png", name: "deploy-beacon"}],
    });
}
