import { AutoView } from "@shared/datagram";
import { Connector } from "./connector";
import {
    DynamicHitbox,
    MarkerDetector,
    Message,
    NetManager,
    ObjectScope,
    Physics,
    PhysicsDrawable,
    ServerInfo,
    SubControl,
    ShipBehaviour,
    Sync,
    Transform,
} from "./registry";
import { Layer } from "@shared/physics/chunks";
import { headerId } from "@shared/netManager";
import { Vector } from "@shared/types";
import { startDevServer } from "./devserver";
import { serverMode } from "@shared/serverInfo";
import { messageType } from "@shared/messages";
import { initCommon, submarineLayer, terrainLayer } from "@shared/common";
import { Detector } from "./server/detector";
import { RangeDetector } from "./server/rangeDetector";
import { RangeDetectable } from "./server/rangeDetectable";
import { Client } from "./client";
import { drawableExtra } from "@shared/mock/drawable";
import { startContentServer } from "./contentServe";
import fs from "fs";
import { clientGasManager, setupGas } from "./gas/gasHandler";
import { GasChecker } from "./gas/gasChecker";

export const DEV_MODE = !!process.env.dev;

initCommon();
startContentServer();
if (DEV_MODE) startDevServer();
setupGas();
NetManager.initDatagrams();
NetManager.identity = 0;
export const connector = new Connector();
connector.start();
console.log("ready");
const game = ObjectScope.game;

export enum physicsLayerEnum {
    marker,
    detectable,
    fishFood,
}

export const physicsLayers: Record<physicsLayerEnum, Layer> = {
    [physicsLayerEnum.marker]: new Layer(),
    [physicsLayerEnum.detectable]: new Layer(),
    [physicsLayerEnum.fishFood]: new Layer(),
};

function createInfoObject() {
    const serverInfoObject = ObjectScope.network.createObject();
    const serverInfo = serverInfoObject.addComponent(ServerInfo);
    const serverInfoSync = serverInfoObject.addComponent(Sync);
    serverInfoSync.authorize([serverInfo], NetManager.identity);
    serverInfoSync.init();
    serverInfo.init();
}

createInfoObject();
export const clientSubs = new Map<number, ShipBehaviour>();

if (!DEV_MODE) {
    const data = JSON.parse(fs.readFileSync("persistent.json", "utf8"));
    ObjectScope.network = ObjectScope.fromSerialisable(data);
    console.log("loaded persistent");
}

export function createSubmarine(client: Client) {
    const sub = game.createObject();
    const net = sub.addComponent(Sync);
    const hitbox = sub.addComponent(DynamicHitbox);
    const control = sub.addComponent(SubControl);
    const physics = sub.addComponent(Physics);
    const drawable = sub.addComponent(PhysicsDrawable);
    const ship = sub.addComponent(ShipBehaviour);
    const transform = sub.addComponent(Transform);
    const detector = sub.addComponent(RangeDetector);
    const detectable = sub.addComponent(RangeDetectable);
    const markerDetector = sub.addComponent(MarkerDetector);
    const gasChecker = sub.addComponent(GasChecker);
    control.submarine = ship;
    ship.physics = physics;
    ship.owner = client.id;
    gasChecker.range = 10000;
    drawable.physics = physics;
    ship.hitbox = hitbox;
    hitbox.sides = new Vector(300, 300);
    drawable.url = "/assets/jolines.png";
    drawable.extra = drawableExtra.entity;
    hitbox.peek = [terrainLayer, submarineLayer];
    hitbox.poke = [submarineLayer];
    net.authorize([ship, transform, drawable, physics]);
    net.authorize([control], client.id);
    net.exclusivity([control], client.id);
    detector.range = { x: 10000, y: 10000 };
    detector.subscribe(client);
    markerDetector.subscribe(client);
    sub.initialiseComponents();
    ObjectScope.network.scopeObject(sub);
    clientSubs.set(client.id, ship);
    return sub;
}

const tps = 20;
const sendView = new AutoView(new ArrayBuffer(1000000));
setInterval(() => {
    const tim = performance.now();

    const serverInfo = ServerInfo.get();
    if (serverInfo.mode == serverMode.update || (serverInfo.mode == serverMode.pause && serverInfo.tick == 1)) {
        const dt = 1 / tps;
        game.fire("input");
        game.fire("update", dt * 60);
        game.fire("collisions", dt * 60);
        game.fire("physics", dt * 60);
        game.fire("post-collision", dt * 60);
        serverInfo.time += dt;
    }

    Detector.processAll();

    
    sendView.index = 0;
    clientGasManager.serialise(sendView);
    
    sendView.writeUint16(headerId.objects);
    const sbindex = sendView.index;
    sendView.writeUint16(0);

    if (ServerInfo.get().parent.getComponentByType(Sync).writeAuthorityBits(sendView)) {
        sendView.setUint16(sbindex, 1);
    }

    const bindex = sendView.index;
    let maxIndex = bindex;
    for (const [_, client] of connector.clients) {
        sendView.index = bindex;
        if (serverInfo.tick != 0) Message.write(sendView, { typeId: messageType.tick });

        client.writeMessages(sendView);
        client.writeObjects(sendView);
        client.send(sendView);
        maxIndex = Math.max(sendView.index, maxIndex);
    }

    if (serverInfo.tick == 1) serverInfo.tick = 0;
    serverInfo.sendBuffer = maxIndex;
    serverInfo.tickTime = performance.now() - tim;
    serverInfo.invalidateCache();
}, 1000 / tps);

export function clearAll() {
    for (const [sw, client] of connector.clients) {
        client.untrackAll();
    }

    Sync.localAuthority.clear();

    for (const [id, bo] of ObjectScope.network.baseObjects) {
        bo.remove();
    }

    for (const [id, layer] of Layer.list) {
        for (const [aid, area] of layer.areas) {
            area.members.clear();
        }
        layer.areas.clear();
    }

    ObjectScope.network.clear();
}
