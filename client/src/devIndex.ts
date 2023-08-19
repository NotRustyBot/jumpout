import { ObjectScope } from "@shared/objectScope";
import { BaseObject } from "@shared/baseObject";
console.log("dev enabled");

import html from "./dev/screen.html";
document.body.innerHTML += html;
import { app } from "./index";

import { DevAttach } from "./dev/devDebugAttach";
import { Camera } from "./camera";
import { DevControl, InteractionMode, interactionMode } from "./dev/devControls";
import { NetComponent } from "@shared/netComponent";
import { Component } from "@shared/component";

let factories: Array<string> = [];

DevAttach.init();
app.stage.addChild(DevAttach.container);
const baseDebugUrl = "http://" + window.location.hostname + ":3001/dev";

const spawnUi = document.getElementsByClassName("dev-spawn")[0];
export let selectedFactory: string | undefined = undefined;

fetch(baseDebugUrl + "/factories").then(async (r) => {
    factories = JSON.parse(await r.text());
    const buttons: Array<HTMLInputElement> = [];
    for (const factory of factories) {
        const factoryButton = document.createElement("input");
        factoryButton.type = "button";
        factoryButton.value = factory;
        factoryButton.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedFactory = factory;
            for (const butt of buttons) {
                butt.classList.remove("on");
            }
            factoryButton.classList.add("on");
        });
        spawnUi.appendChild(factoryButton);
        buttons.push(factoryButton);
    }
});

document.addEventListener("click", (e) => {
    if (selectedFactory && InteractionMode.current == interactionMode.spawn) {
        e.stopPropagation();
        const worldCoords = Camera.toWorld(e);
        fetch(baseDebugUrl + "/spawn/" + selectedFactory + `/${worldCoords.x}/${worldCoords.y}`);
    }
});

BaseObject.attach = DevAttach.attachTo;
BaseObject.detach = DevAttach.detachFrom;

DevControl.init();

const debugPort = 3001;
window.addEventListener("keydown", (e) => {
    if (e.key == "F8") {
        e.preventDefault();
        var data = new FormData();
        data.append("content", JSON.stringify(ObjectScope.game.toDeepSerialisable()));
        fetch("http://" + window.location.hostname + ":" + debugPort + "/data", { method: "put", body: data });
    }
});

function startDragDrop() {
    const element = document.getElementById("dropzone");
    if (!element) throw "no #dropzone found";
    element.addEventListener("dragover", (drag) => {
        element.classList.add("drag");
        drag.preventDefault();
    });
    element.addEventListener("dragleave", (drag) => {
        element.classList.remove("drag");
        drag.preventDefault();
    });

    element.addEventListener("drop", (drag) => {
        console.log("drop");
        element.classList.remove("drag");
        drag.preventDefault();
        if (drag.dataTransfer == null) return;

        if (drag.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            [...drag.dataTransfer.items].forEach((item, i) => {
                // If dropped items aren't files, reject them
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        uploadFile(file, drag.pageX, drag.pageY);
                    }
                }
            });
        }
    });
}

function uploadFile(file: File, x: number, y: number) {
    let formData = new FormData();
    formData.append(file.name, file);
    fetch(baseDebugUrl + "/upload", { method: "POST", body: formData });
}

startDragDrop();

fetch(baseDebugUrl + "/info").then(async (r) => {
    const info = await r.json();

    const skeys = info.netComponents as Array<{typeId: string, name: string}>
    const serverKeys = new Set(skeys.map(nc => nc.typeId));

    const keys = new Set(
        Object.entries(Component.componentTypes)
            .filter(([k, comp]) => comp.prototype instanceof NetComponent)
            .map(([k, comp]) => k)
    );

    for (const key of keys) {
        if (serverKeys.has(key)) {
            serverKeys.delete(key);
            keys.delete(key);
        }
    }

    if (keys.size == 0 && serverKeys.size == 0) return;
    let warning = "Mismatch between server and client NetComponents.";
    if(keys.size) warning += "\n\nserver is missing: " + [...keys].map(k => NetComponent.componentTypes[parseInt(k)].name).join(", ");
    if(serverKeys.size) warning += "\n\nclient is missing: " + [...serverKeys].map(k => skeys.find(nc => k == nc.typeId).name).join(", ");

    console.warn(warning);
});
