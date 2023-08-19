import { BaseObject } from "@shared/baseObject";
import { Marker as MockMarker, SerialisedMarkerComponent } from "@shared/mock/marker";
import { ObjectScope } from "@shared/objectScope";
import { Camera } from "camera";
import { Waypoint } from "ui/uiHandler";

export class Marker extends MockMarker {
    waypoint: Waypoint;
    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        ObjectScope.game.subscribe("update", this);
    }

    ["update"](dt: number) {
        if (this.parent.position.distanceSquared(Camera.position.result().mult(-1)) < this.range ** 2) {
            if (!this.waypoint) {
                this.waypoint = new Waypoint(this.parent.position);
                this.waypoint.sprite.tint = this.tint;
                this.waypoint.name = this.name;
            }
            this.waypoint.position = this.parent.position;
        } else {
            if (this.waypoint) {
                this.waypoint.remove();
                this.waypoint = undefined;
            }
        }
    }

    updateInfo() {
        if (this.waypoint) {
            this.waypoint.name = this.name;
            this.waypoint.sprite.tint = this.tint;
        }
    }

    override onRemove(): void {
        ObjectScope.game.unsubscribe("update", this);
        if(this.waypoint){
            this.waypoint.remove();
            this.waypoint = undefined;
        }
    }

    override fromSerialisable(data: SerialisedMarkerComponent): void {
        super.fromSerialisable(data);
        this.updateInfo();
    }
}
