import { BaseObject } from "@shared/baseObject";
import { Component } from "@shared/component";
import { ObjectScope } from "@shared/objectScope";
import { Sync } from "@shared/sync";
import { Network } from "../network";
import { DevAttach } from "./devDebugAttach";
import { NetComponent } from "@shared/netComponent";
import { InteractionMode, interactionMode } from "./devControls";

export class DevObjectInfo {
    baseObject: BaseObject;
    devAttach: DevAttach;

    container: HTMLDivElement;
    identity: HTMLSpanElement;
    head: HTMLSpanElement;

    compInfo: Map<Component, DevComponentInfo> = new Map();

    private static _container: HTMLDivElement;

    public static get container(): HTMLDivElement {
        if (!this._container) this._container = document.getElementsByClassName("dev-objects")[0]! as HTMLDivElement;
        return this._container;
    }

    constructor(devattach: DevAttach, baseObject: BaseObject) {
        this.devAttach = devattach;
        this.baseObject = baseObject;
        this.createHTML();
    }

    createHTML() {
        this.container = document.createElement("div");
        this.container.classList.add("dev-object-info");
        this.container.classList.add("closed");
        this.identity = document.createElement("i");
        this.head = document.createElement("b");
        this.refresh();
        this.container.appendChild(this.identity);
        this.container.appendChild(this.head);
        this.container.addEventListener("click", (e) => {
            e.stopPropagation();
            DevAttach.select(this.devAttach);
            InteractionMode.select(interactionMode.components);
        });

        DevObjectInfo.container.appendChild(this.container);
    }

    onSelect() {
        this.refresh();
    }

    onDeselect() {
        for (const [_, compInfo] of this.compInfo) {
            compInfo.remove();
        }
    }

    refresh() {
        const netId = this.baseObject.getId(ObjectScope.network);
        const id = (this.baseObject.getId(ObjectScope.game) ?? "n/a") + (netId != undefined ? "(" + netId + ")" : "");
        this.identity.innerText = id;
        for (const [_, comp] of this.baseObject.components) {
            if (!this.compInfo.has(comp)) this.compInfo.set(comp, new DevComponentInfo(this, comp));
            const compInfo = this.compInfo.get(comp);
            compInfo.refresh();
        }

        for (const [comp, compInfo] of this.compInfo) {
            if(comp?.parent.components.has(comp.id))continue;
            this.compInfo.delete(comp);
            compInfo.remove();
        }
    }

    remove() {
        this.container.remove();
        for (const [_, compInfo] of this.compInfo) {
            compInfo.remove();
        }
    }
}

export class DevComponentInfo {
    container: HTMLDivElement;
    comp: Component;
    textarea: HTMLTextAreaElement;
    devObjectInfo: DevObjectInfo;
    isOpen = false;

    private static _container: HTMLDivElement;
    head: HTMLSpanElement;

    public static get container(): HTMLDivElement {
        if (!this._container) this._container = document.getElementsByClassName("dev-components")[0]! as HTMLDivElement;
        return this._container;
    }

    constructor(devObjectInfo: DevObjectInfo, component: Component) {
        this.devObjectInfo = devObjectInfo;
        this.comp = component;
    }

    createHTML() {
        this.container = document.createElement("div");
        this.container.classList.add("dev-object-info");
        if (!this.isOpen) this.container.classList.add("closed");
        const identity = document.createElement("i");
        this.head = document.createElement("b");
        identity.innerText = this.comp.id.toString();
        this.head.innerText = this.comp.typeName();
        this.container.appendChild(identity);
        this.container.appendChild(this.head);
        this.textarea = document.createElement("textarea");
        this.textarea.spellcheck = false;
        this.textarea.value = JSON.stringify(this.comp.toSerialisable(), null, 2);
        this.textarea.style.height = this.textarea.value.split("\n").length * 16 + "px";
        this.container.appendChild(this.textarea);
        this.textarea.addEventListener("mousedown", (e) => {
            e.stopPropagation();
        });

        this.textarea.addEventListener("change", (e) => {
            const txt = this.textarea.value;
            this.comp.fromSerialisable(JSON.parse(txt));
            const sync = this.comp.parent.getComponentByType(Sync);
            if (sync) {
                Network.tempAuthority.push(sync);
            }
        });

        this.container.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.container.classList.toggle("closed");
            this.isOpen = !this.isOpen;
        });

        DevComponentInfo.container.appendChild(this.container);
    }

    refresh() {
        if (!this.container) this.createHTML();
        const compData = this.comp.toSerialisable();
        if (this.textarea == document.activeElement) return;
        this.textarea.value = JSON.stringify(compData, null, 2);
        if (this.comp instanceof NetComponent) this.head.innerText = this.comp.typeName() + " " + Math.floor((this.comp.cacheId / Network.sendCount) * 100) + "%";
    }

    remove() {
        if (this.container) {
            this.container.remove();
            this.container = undefined;
        }
    }
}
