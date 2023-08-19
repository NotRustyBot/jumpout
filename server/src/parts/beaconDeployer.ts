import { drawableExtra } from "@shared/mock/drawable";
import { ObjectScope } from "@shared/objectScope";
import { BeaconDeployerPart as MockBeaconDeployerPart } from "@shared/parts/beaconDeployer";
import { Drawable, Hitbox, Light, MarkerDetectable, Sync, Transform } from "../registry";
import { RangeDetectable } from "../server/rangeDetectable";
import { Client } from "src/client";
import { messageType } from "@shared/messages";
import { Marker } from "@shared/mock/marker";
import { Vectorlike } from "@shared/types";
import { beaconLayer } from "@shared/common";

export class BeaconDeployerPart extends MockBeaconDeployerPart {
    override ["deploy-beacon"](data: { gameId: number; client: Client; position: Vectorlike }): void {
        if (this.parent.position.distanceSquared(data.position) < 500 ** 2) {
            const beacon = ObjectScope.game.createObject();
            const transform = beacon.addComponent(Transform);
            const drawable = beacon.addComponent(Drawable);
            const sync = beacon.addComponent(Sync);
            const glow = beacon.addComponent(Light);
            const detectable = beacon.addComponent(RangeDetectable);
            const markerDetectable = beacon.addComponent(MarkerDetectable);
            const marker = beacon.addComponent(Marker);
            const hitbox = beacon.addComponent(Hitbox);
            drawable.url = "/assets/beacon.png";
            drawable.extra = drawableExtra.background;
            transform.position.set(data.position.x, data.position.y);
            markerDetectable.range = 10000;
            marker.range = 10000;
            marker.tint = 0xffaa33;
            marker.name = "beacon";
            glow.offset.y = -45;
            glow.range = 100;
            glow.intensity = 3;
            glow.extra = 1;
            glow.tint = 0xffaa88;
            hitbox.poke = [beaconLayer];
            sync.authorize([transform, drawable, marker, glow, hitbox]);
            beacon.initialiseComponents();
            ObjectScope.network.scopeObject(beacon);
            data.client.message({ typeId: messageType.objectLink, netId: beacon.getId(ObjectScope.network), linkId: data.gameId });
            
        } else {
            data.client.message({ typeId: messageType.actionFailedLinked, linkId: data.gameId, text: "Action Failed" });
        }
    }
}
