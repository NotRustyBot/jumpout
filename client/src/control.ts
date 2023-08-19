import { ObjectScope } from "@shared/objectScope";

export const keys: Record<string, number> = {};
export const mouse = {
    position: {
        x: 0,
        y: 0,
    },
    clicked: 0,
};

document.addEventListener("keydown", (e) => {
    if (!keys[e.key]) keys[e.key] = 0.1;
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = 0;
});

document.addEventListener("mousemove", (e) => {
    mouse.position.x = e.x;
    mouse.position.y = e.y;
});

document.addEventListener("mousedown", (e) => {
    mouse.position.x = e.x;
    mouse.position.y = e.y;
    mouse.clicked = 0.1;
});

document.addEventListener("mouseup", (e) => {
    mouse.position.x = e.x;
    mouse.position.y = e.y;
    mouse.clicked = 0;
});

const keyManager = {
    ["input"]() {
        if (mouse.clicked == 0.1) {
            mouse.clicked = 1;
        } else if (mouse.clicked > 0) {
            mouse.clicked++;
        }

        for (const k in keys) {
            if (keys[k] == 0.1) {
                keys[k] = 1;
                continue;
            }

            if (keys[k]) keys[k]++;
        }
    },
};

ObjectScope.game.subscribe("input", keyManager);
