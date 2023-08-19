import { partActions } from "@shared/common";
import { Message, messageType } from "@shared/messages";
import { drawableExtra } from "@shared/mock/drawable";
import { ObjectScope } from "@shared/objectScope";
import { BeaconDeployerPart as MockBeaconDeployerPart } from "@shared/parts/beaconDeployer";
import { Transform } from "@shared/transform";
import { Drawable } from "../drawable";
import { Network } from "../network";
import { IMouseHandler, IUiPart, UI, UiAction } from "ui/uiHandler";
import { Vectorlike } from "@shared/types";
import { Camera } from "camera";
import { Sprite } from "pixi.js";
import { worldUiLayer } from "index";

export class BeaconDeployerPart extends MockBeaconDeployerPart implements IMouseHandler, IUiPart {

    sprite: Sprite;
    override ["deploy-beacon"](): void {
        if (!UI.useMouseHandler(this)) return;
        UI.setHintText("click to place beacon");
        this.sprite = Sprite.from("/assets/beacon.png");
        this.sprite.alpha = 0.5;
        this.sprite.anchor.set(0.5);
        worldUiLayer.addChild(this.sprite);
    }

    handleMouse(position: Vectorlike, click: number) {
        position = Camera.toWorld(position);
        this.sprite.position.set(position.x, position.y);
        if (this.parent.position.distance(position) < 500) {
            this.sprite.tint = 0x00ff00;
            if (click == 1) {
                this.deploy(position);
                UI.clearHandler();
            }
        } else {
            this.sprite.tint = 0xff0000;
        }
    }

    updateUI(button: UiAction): void {
        
    }

    cancelMouse() {
        this.sprite.destroy();
        this.sprite = undefined;
        UI.setHintText();
    }

    deploy(position: Vectorlike) {
        const beacon = ObjectScope.game.createObject();
        const drawable = beacon.addComponent(Drawable);
        const transfrom = beacon.addComponent(Transform);
        drawable.url = "/assets/beacon.png";
        drawable.extra = drawableExtra.background;
        drawable.init();
        transfrom.init();

        beacon.position.set(position.x, position.y);

        Network.message({
            typeId: messageType.partActivityLinkedPositioned,
            linkId: beacon.getId(ObjectScope.game),
            objectId: this.parent.getId(ObjectScope.network),
            action: partActions.deployBeacon,
            position: position,
        });
    }
}
