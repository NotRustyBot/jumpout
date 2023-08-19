import { BaseObject, SerialisedBaseObject } from "@shared/baseObject";
import { ObjectScope } from "@shared/objectScope";
import { Container, Graphics } from "pixi.js";
import { Drawable } from "../drawable";
import { PhysicsDrawable } from "../physicsDrawable";
import { Hitbox } from "@shared/hitbox";
import { DynamicHitbox } from "@shared/dynamicHitbox";
import { Vector, Vectorlike } from "@shared/types";
import { ServerInfo, serverMode } from "@shared/serverInfo";
import { Camera } from "../camera";
import { DevObjectInfo } from "./devObjectInfo";
import { InteractionMode, interactionMode } from "./devControls";
import { Network } from "../network";
import { Sync } from "@shared/sync";
import { keys } from "../control";
import { messageType } from "@shared/messages";

export class DevAttach {
    static container = new Container();
    static attached = new Set<DevAttach>();
    static lookup = new Map<BaseObject, DevAttach>();
    /** not actually a parent (DevAttach is not a component)*/
    parent: BaseObject;
    ui: DevObjectInfo;

    graphics: Graphics;

    hitbox?: Hitbox;
    drawable?: Drawable;

    static drawDebug = false;
    static showComponents = false;
    static showObjects = false;

    static playPauseButton: HTMLInputElement;
    static init() {
        ObjectScope.game.subscribe("draw", this);
        this.playPauseButton = document.getElementById("timeStop") as HTMLInputElement;

        let offset: Vector;
        window.addEventListener("mousedown", (e) => {
            const pos = Camera.toWorld(e);
            this.handleClick(pos);
            if (InteractionMode.current == interactionMode.modify && this.selected) {
                offset = this.selected.parent.position.result().diff(pos);
            }
        });

        window.addEventListener("mousemove", (e) => {
            const pos = Camera.toWorld(e);
            if (InteractionMode.current == interactionMode.modify && this.selected && offset != undefined) {
                if (keys["Control"]) {
                    const grid = 110;
                    const newPos = offset.result().add(pos);
                    newPos.x = Math.round(newPos.x / grid) * grid;
                    newPos.y = Math.round(newPos.y / grid) * grid;
                    this.selected.parent.position.set(...newPos.xy());
                } else {
                    this.selected.parent.position.set(...offset.result().add(pos).xy());
                }
                const sync = this.selected.parent.getComponentByType(Sync);
                if (sync) {
                    Network.tempAuthority.push(sync);
                }

                const hitbox = this.selected.parent.getComponentByType(Hitbox);
                if (hitbox) {
                    hitbox.move();
                }
            }
        });

        window.addEventListener("mouseup", (e) => {
            if (InteractionMode.current == interactionMode.modify && this.selected && offset != undefined) {
                offset = undefined;
            }
        });
    }

    private constructor(baseobject: BaseObject) {
        ObjectScope.game.subscribe("draw", this);
        this.parent = baseobject;
        this.graphics = new Graphics();
        DevAttach.container.addChild(this.graphics);
        this.ui = new DevObjectInfo(this, baseobject);
    }

    static attachTo(baseobject: BaseObject) {
        const newAttached = new DevAttach(baseobject);
        DevAttach.attached.add(newAttached);
        DevAttach.lookup.set(baseobject, newAttached);
        return newAttached;
    }

    static detachFrom(baseobject: BaseObject) {
        console.log("detaching");

        const toDetach = DevAttach.lookup.get(baseobject);
        DevAttach.lookup.delete(baseobject);
        DevAttach.attached.delete(toDetach);
        ObjectScope.game.unsubscribe("draw", toDetach);
        toDetach.graphics.destroy();
        if (DevAttach.selected == toDetach) DevAttach.select(undefined);
    }

    ["draw"](dt: number) {
        if (this.drawable && this.drawable.sprite.destroyed) this.drawable = undefined;

        if (!this.hitbox) this.hitbox = this.parent.getComponentByType(Hitbox);
        if (!this.hitbox) this.hitbox = this.parent.getComponentByType(DynamicHitbox);
        if (!this.drawable) this.drawable = this.parent.getComponentByType(Drawable);
        if (!this.drawable) this.drawable = this.parent.getComponentByType(PhysicsDrawable);
        this.graphics.clear();
        let alpha = 0.5;
        if (this.selected) {
            alpha = 1;
            this.ui.refresh();
        }

        if (!DevAttach.drawDebug) return;

        if (this.hitbox) {
            this.graphics.lineStyle(1 / Camera.scale, "#00ffaa", alpha);
            this.graphics.drawRect(this.hitbox.x1, this.hitbox.y1, ...this.hitbox.sides.xy());

            this.graphics.lineStyle(2 / Camera.scale, "#ffaaaa", alpha);

            for (const area of this.hitbox.pokeAreas) {
                this.graphics.drawRect(area.gridPosition.x * area.layer.size, area.gridPosition.y * area.layer.size, area.layer.size, area.layer.size);
            }
        }

        if (this.drawable) {
            const width = this.drawable.sprite.width;
            const height = this.drawable.sprite.height;
            this.graphics.lineStyle(1, "#00aaff", alpha);
            this.graphics.drawRect(this.parent.position.x - width / 2, this.parent.position.y - height / 2, width, height);
        }
    }

    static serverTicks = 0;
    static sendBuffer = 0;
    static ["draw"](dt: number) {
        DevAttach.container.position.set(Camera.position.x * Camera.scale, Camera.position.y * Camera.scale);
        DevAttach.container.scale.set(Camera.scale);

        if (this.selected && keys["Delete"]) {
            const netId = this.selected.parent.getId(ObjectScope.network);
            if (netId) {
                Network.message({
                    typeId: messageType.devDelete,
                    objectId: netId
                });
            }
            this.selected.parent.remove();
            this.selected = undefined;
        }

        if (ServerInfo.get()) {
            this.serverTicks = (this.serverTicks * 19 + ServerInfo.get().tickTime) / 20;
            this.sendBuffer = (this.sendBuffer * 19 + ServerInfo.get().sendBuffer) / 20;
            document.getElementById("server-ticks").innerHTML = ((this.serverTicks / 50) * 100).toFixed(1) + "% " + (this.sendBuffer / 1000).toFixed(1) + "k";

            if (ServerInfo.get().mode == serverMode.pause) {
                this.playPauseButton.classList.remove("on");
                this.playPauseButton.classList.add("off");
            } else {
                this.playPauseButton.classList.remove("off");
                this.playPauseButton.classList.add("on");
            }
        }
    }

    static spriteClicks = true;
    inboud(vector: Vectorlike) {
        if (DevAttach.spriteClicks && this.drawable && !this.drawable.sprite.destroyed) {
            const width = this.drawable.sprite.width;
            const height = this.drawable.sprite.height;
            const x1 = this.parent.position.x - width / 2;
            const x2 = this.parent.position.x + width / 2;
            const y1 = this.parent.position.y - height / 2;
            const y2 = this.parent.position.y + height / 2;
            if (vector.x > x1 && vector.x < x2 && vector.y > y1 && vector.y < y2) {
                return true;
            }
        }
        return false;
    }

    static selected?: DevAttach;
    static select(attached?: DevAttach) {
        if (this.selected) this.selected.ui.onDeselect();
        if (this.selected) this.selected.selected = false;
        if (attached) attached.selected = true;
        this.selected = attached;
        if (attached) attached.ui.onSelect();
    }

    selected = false;

    static handleClick(mouse: Vector) {
        let nearest = undefined;
        let maxDist = Infinity;
        for (const attached of this.attached) {
            if (!attached.inboud(mouse)) continue;

            const dist = attached.parent.position.distanceSquared(mouse);
            if (dist < maxDist) {
                nearest = attached;
                maxDist = dist;
            }
        }
        if(nearest != undefined)this.select(nearest);
    }
}
