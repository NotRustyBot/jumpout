import { ObjectScope } from "@shared/objectScope";
import { ServerInfo, serverMode } from "@shared/serverInfo";
import { DevAttach } from "./devDebugAttach";

export enum interactionMode {
    node,
    objects,
    components,
    spawn,
    modify,
}

export class DevControl {
    static baseDebugUrl = "http://" + window.location.hostname + ":3001/dev";

    static button(id: string, action: (button: HTMLInputElement) => void) {
        const btn = document.getElementById(id) as HTMLInputElement;
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            action(btn);
        });
    }

    static toggle(id: string, proxy: (set?: boolean) => boolean) {
        const btn = document.getElementById(id) as HTMLInputElement;

        const action = (setTo: boolean) => {
            if (setTo) {
                proxy(true);
                btn.classList.add("on");
                btn.classList.remove("off");
            } else {
                proxy(false);
                btn.classList.remove("on");
                btn.classList.add("off");
            }
        };
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const currentState = proxy();
            action(!currentState);
        });

        return action;
    }

    static init() {
        this.button("saveState", () => {
            fetch(DevControl.baseDebugUrl + "/save");
        });

        this.button("loadState", () => {
            fetch(DevControl.baseDebugUrl + "/load");
        });

        this.button("timeStop", () => {
            if (ServerInfo.get().mode == serverMode.pause) {
                fetch(DevControl.baseDebugUrl + "/play");
            } else {
                fetch(DevControl.baseDebugUrl + "/pause");
            }
        });

        this.button("timeStep", () => {
            fetch(DevControl.baseDebugUrl + "/tick");
        });

        ObjectScope.game.subscribe("draw", this);

        DevControl.toggle("drawDebug", (set?: boolean) => {
            if (set != undefined) DevAttach.drawDebug = set;
            return DevAttach.drawDebug;
        });

        InteractionMode.create("objectList", "dev-objects", interactionMode.objects);
        InteractionMode.create("objectInfo", "dev-components", interactionMode.components);
        InteractionMode.create("objectSpawn", "dev-spawn", interactionMode.spawn);
        InteractionMode.create("objectMove", "", interactionMode.modify);
    }

    static ["draw"]() {}
}

export class InteractionMode {
    static interactionModes: Map<interactionMode, InteractionMode> = new Map();
    static current: interactionMode = interactionMode.node;

    button: HTMLInputElement;
    div: HTMLDivElement;
    mode: interactionMode;

    constructor(button: string, hide: string, mode: interactionMode) {
        this.mode = mode;
        this.button = document.getElementById(button) as HTMLInputElement;
        this.button.addEventListener("click", (e) => {
            e.stopPropagation();
            InteractionMode.select(this.mode);
        });
        this.div = document.getElementsByClassName(hide)[0] as HTMLDivElement;
    }

    static select(mode: interactionMode){
        const choosen = this.interactionModes.get(mode);
        for (const [type, mode] of InteractionMode.interactionModes) {
            mode.unset();
        }

        choosen.set();
        InteractionMode.current = mode;
    }

    static create(button: string, hide: string, mode: interactionMode) {
        this.interactionModes.set(mode, new InteractionMode(button, hide, mode));
    }

    set() {
        this.button.classList.replace("off", "on");
        if (this.div) this.div.classList.remove("hidden");
    }

    unset() {
        this.button.classList.replace("on", "off");
        if (this.div) this.div.classList.add("hidden");
    }
}
