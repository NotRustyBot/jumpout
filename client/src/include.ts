import { SubControl } from "./submarineControl"
import { Drawable } from "./drawable"
import { DynamicHitbox } from "../../shared/dynamicHitbox"
import { Hitbox } from "../../shared/hitbox"
import { Physics } from "../../shared/physics"
import { PhysicsDrawable } from "./physicsDrawable"
import { ShipBehaviour } from "../../shared/shipBehaviour"
import { Transform } from "../../shared/transform"
import { Sync } from "@shared/sync"
import { Light } from "./light"
import { ServerInfo } from "@shared/serverInfo"
import { ClientData } from "@shared/clientData"
import { BeaconDeployerPart } from "./parts/beaconDeployer"
import { Marker } from "marker"


export function initModules(){
    SubControl.initialise();
    ServerInfo.initialise();
    Marker.initialise();
    Drawable.initialise();
    DynamicHitbox.initialise();
    Hitbox.initialise();
    Physics.initialise();
    PhysicsDrawable.initialise();
    ShipBehaviour.initialise();
    Transform.initialise();
    Sync.initialise();
    Light.initialise();
    ClientData.initialise();
    BeaconDeployerPart.initialise();
}