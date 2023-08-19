import express from "express";
import fs from "fs";
import cors from "cors";
import { Drawable, Hitbox, ObjectScope, Sync, Transform } from "./registry";
import fileUpload from "express-fileupload";
import { clearAll, connector } from "./main";
import { ServerInfo, serverMode } from "@shared/serverInfo";
import { BaseObject } from "@shared/baseObject";
import { Vector, Vectorlike } from "@shared/types";
import { RangeDetectable } from "./server/rangeDetectable";
import { Detector } from "./server/detector";
import { drawableExtra } from "@shared/mock/drawable";
import { terrainLayer } from "@shared/common";
import { Component } from "@shared/component";
import { NetComponent } from "@shared/netComponent";

export function startDevServer() {
    const assetsPath = "../client/static/assets/";

    const app = express();
    app.use(fileUpload());
    app.use(cors());

    app.get("/dev/save", function (req, res) {
        const data = ObjectScope.network.toDeepSerialisable();
        fs.writeFileSync("persistent.json", JSON.stringify(data));
        res.send("OK");
    });

    app.get("/dev/info", function (req, res) {
        res.send(
            JSON.stringify({
                netComponents: Object.entries(Component.componentTypes)
                    .filter(([k, comp]) => comp.prototype instanceof NetComponent)
                    .map(([k, comp]) => ({ typeId: k, name: comp.name })),
            })
        );
    });

    app.post("/dev/upload", function (req, res) {
        console.log("processing upload");

        for (const filename in req.files) {
            if (Object.prototype.hasOwnProperty.call(req.files, filename)) {
                let file = req.files[filename] as fileUpload.UploadedFile;
                if (fs.existsSync(assetsPath + file.name)) {
                    console.log("replacing " + file.name);
                } else {
                    console.log("adding " + file.name);
                }
                fs.writeFile(assetsPath + file.name, file.data, () => {});
            }
        }
        res.send();
    });

    app.get("/dev/load", function (req, res) {
        const data = JSON.parse(fs.readFileSync("persistent.json", "utf8"));
        clearAll();
        ObjectScope.network = ObjectScope.fromSerialisable(data);
        for (const [ws, client] of connector.clients) {
            Detector.subscribeClient(client);
        }
        res.send("OK");
    });

    app.get("/dev/tick", function (req, res) {
        ServerInfo.get().tick = 1;
        res.send("OK");
    });

    app.get("/dev/factories", function (req, res) {
        res.send(JSON.stringify([...factories.keys()]));
    });

    app.get("/dev/spawn/:name/:x/:y", function (req, res) {
        const factory = factories.get(req.params.name);
        factory({ x: parseFloat(req.params.x), y: parseFloat(req.params.y) });
        res.send("OK");
    });

    app.get("/dev/pause", function (req, res) {
        ServerInfo.get().mode = serverMode.pause;
        res.send("OK");
    });

    app.get("/dev/play", function (req, res) {
        ServerInfo.get().mode = serverMode.update;
        res.send("OK");
    });

    app.listen(3001);

    console.log("dev server listening");
}

type factory = (position: Vectorlike) => BaseObject;

const factories = new Map<string, factory>();

export function registerFactory(name: string, factory: factory) {
    factories.set(name, factory);
}

registerFactory("terrain", (v) => {
    const terrain = ObjectScope.game.createObject();
    const transform = terrain.addComponent(Transform);
    const drawable = terrain.addComponent(Drawable);
    const hitbox = terrain.addComponent(Hitbox);
    const sync = terrain.addComponent(Sync);
    const detectable = terrain.addComponent(RangeDetectable);
    hitbox.sides = new Vector(220, 220);
    drawable.url = "/assets/terrain.png";
    drawable.extra = drawableExtra.terrain;
    hitbox.poke = [terrainLayer];
    transform.position.set(v.x, v.y);
    sync.authorize([transform]);
    terrain.initialiseComponents();
    ObjectScope.network.scopeObject(terrain);
    return terrain;
});

registerFactory("terrain2", (v) => {
    const terrain = ObjectScope.game.createObject();
    const transform = terrain.addComponent(Transform);
    const drawable = terrain.addComponent(Drawable);
    const hitbox = terrain.addComponent(Hitbox);
    const sync = terrain.addComponent(Sync);
    const detectable = terrain.addComponent(RangeDetectable);
    hitbox.sides = new Vector(440, 440);
    drawable.url = "/assets/terrain2.png";
    drawable.extra = drawableExtra.terrain;
    hitbox.poke = [terrainLayer];
    transform.position.set(v.x, v.y);
    sync.authorize([transform]);
    terrain.initialiseComponents();
    ObjectScope.network.scopeObject(terrain);
    return terrain;
});

registerFactory("image", (v) => {
    const image = ObjectScope.game.createObject();
    const transform = image.addComponent(Transform);
    const drawable = image.addComponent(Drawable);
    const sync = image.addComponent(Sync);
    const detectable = image.addComponent(RangeDetectable);
    drawable.url = "/assets/red.png";
    drawable.extra = drawableExtra.background;
    transform.position.set(v.x, v.y);
    sync.authorize([transform, drawable]);
    image.initialiseComponents();
    ObjectScope.network.scopeObject(image);
    return image;
});
