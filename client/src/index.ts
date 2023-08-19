import * as PIXI from "pixi.js";
import { ObjectScope } from "@shared/objectScope";
import { ScreenFilter } from "./filters/screen/screenFilter";
import { Network } from "./network";
import { Camera } from "./camera";
import { initModules } from "./include";
import { ServerInfo, serverMode } from "@shared/serverInfo";
import { ShipBehaviour } from "@shared/shipBehaviour";
import { SubControl } from "./submarineControl";
import { Vector } from "@shared/types";
import { keys } from "./control";
import { messageType } from "@shared/messages";
import { drawableExtra } from "@shared/mock/drawable";
import { initCommon } from "@shared/common";
import { TerrainFilter } from "./filters/terrain/terrainFilter";
import { UI, Waypoint } from "./ui/uiHandler";
import { PhysicsDrawable } from "physicsDrawable";

const game = ObjectScope.game;

UI.init();

export const app = new PIXI.Application<HTMLCanvasElement>({ backgroundColor: "#112244" });
export let currentSubmarine: ShipBehaviour;

export let time = 0;

document.body.insertBefore(app.view, document.body.firstChild);
function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    app.renderer.resize(windowWidth, windowHeight);
    app.stage.position.set(windowWidth / 2, windowHeight / 2);
    worldLayer.filterArea.x = Math.floor(0);
    worldLayer.filterArea.y = Math.floor(0);
    worldLayer.filterArea.width = Math.floor(windowWidth);
    worldLayer.filterArea.height = Math.floor(windowHeight);

    Camera.size.x = windowWidth;
    Camera.size.y = windowHeight;
}

export const worldLayer = new PIXI.Container();
export const realLayer = new PIXI.Container();
export const backgroundLayer = new PIXI.Container();
export const terrainLayer = new PIXI.Container();
export const entityLayer = new PIXI.Container();
export const lightsLayer = new PIXI.Container();
export const worldUiLayer = new PIXI.Container();
export const uiLayer = new PIXI.Container();
realLayer.addChild(backgroundLayer);
realLayer.addChild(terrainLayer);
realLayer.addChild(entityLayer);
worldLayer.addChild(realLayer);
worldLayer.addChild(lightsLayer);
worldLayer.addChild(worldUiLayer);

app.stage.addChild(worldLayer);
app.stage.addChild(uiLayer);
window.onresize = resize;
worldLayer.filterArea = new PIXI.Rectangle();
realLayer.filterArea = worldLayer.filterArea;
terrainLayer.filterArea = realLayer.filterArea;
lightsLayer.filterArea = realLayer.filterArea;
realLayer.filters = [new ScreenFilter()];
terrainLayer.filters = [new TerrainFilter()];
resize();

const spawnPoint = new Waypoint({ x: 0, y: 0 });
spawnPoint.name = "spawn";

export const currentSubPos = new Vector();
Camera.scale = 0.5;
let accumulator = 0;
let phyTarget = 1 / 20;
app.ticker.add((dt) => {
    const serverInfo = ServerInfo.get() ?? { mode: serverMode.update, tick: 0, time: 0 };
    accumulator += dt / 60;

    if (serverInfo.tick == 1 && serverInfo.mode == serverMode.pause) {
        accumulator = phyTarget;
        dt = phyTarget;
    }

    if (serverInfo.mode == serverMode.pause) {
        accumulator = phyTarget;
        dt = 0;
    }

    game.fire("input");
    if (serverInfo.tick == 1 || serverInfo.mode == serverMode.update) {
        if (serverInfo.tick == 1) serverInfo.tick = 0;

        serverInfo.time += dt / 60;
        time = serverInfo.time;

        while (accumulator >= phyTarget) {
            game.fire("update", 60 * phyTarget);
            game.fire("collisions", 60 * phyTarget);
            game.fire("physics", 60 * phyTarget);
            game.fire("post-collision", 60 * phyTarget);
            accumulator -= phyTarget;
        }
    }

    if (keys["-"]) {
        Camera.scale *= 0.99;
    }

    if (keys["+"]) {
        Camera.scale /= 0.99;
    }

    if (keys["c"] == 1) {
        Camera.detached = !Camera.detached;
        if (Camera.detached) {
            realLayer.filters = [];
            Network.message({ enabled: 1, typeId: messageType.debugCam });
        } else {
            realLayer.filters = [new ScreenFilter()];
            Network.message({ enabled: 0, typeId: messageType.debugCam });
        }
    }

    if (Camera.detached) {
        if (keys["w"]) Camera.position.y += 10 / Camera.scale;
        if (keys["a"]) Camera.position.x += 10 / Camera.scale;
        if (keys["s"]) Camera.position.y -= 10 / Camera.scale;
        if (keys["d"]) Camera.position.x -= 10 / Camera.scale;
        Network.message({
            position: Camera.position.result().mult(-1),
            typeId: messageType.debugCamPosition,
            range: new Vector(Camera.size.x / Camera.scale, Camera.size.y / Camera.scale),
        });
    }

    worldLayer.scale.set(Camera.scale);
    worldLayer.position.set(Camera.position.x * Camera.scale, Camera.position.y * Camera.scale);
    game.fire("draw", dt);

    if (SubControl.current) {
        const drawable = SubControl.current.submarine.parent.getComponentByType(PhysicsDrawable);
        const moveTo = drawable.physics.velocity.result().mult(12).add(drawable.sprite.position);
        Camera.glide(moveTo, 9);
    }

    Network.sendMessages();
    Network.sendObjects();
});

document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

export function addChildByType(child: PIXI.Container, type: number) {
    switch (type) {
        case drawableExtra.background:
            backgroundLayer.addChild(child);
            break;

        case drawableExtra.terrain:
            terrainLayer.addChild(child);
            break;

        case drawableExtra.entity:
            entityLayer.addChild(child);
            break;

        case drawableExtra.lights:
            lightsLayer.addChild(child);
            break;

        default:
            break;
    }
}

initModules();
Network.start();
initCommon();
