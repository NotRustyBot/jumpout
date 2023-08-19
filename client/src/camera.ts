import { Vector, Vectorlike } from "@shared/types";

export class Camera {
    static position = new Vector();
    static scale = 1;
    static size = new Vector();

    static detached = false;

    static toWorld(v: Vectorlike) {
        return new Vector((v.x - Camera.size.x / 2) / Camera.scale - Camera.position.x, (v.y - Camera.size.y / 2) / Camera.scale - Camera.position.y);
    }

    static toScreen(v: Vectorlike) {
        return new Vector((v.x + Camera.position.x) * Camera.scale, (v.y + Camera.position.y) * Camera.scale);
    }

    static move(v: Vectorlike) {
        if (this.detached) return;
        Camera.position.set(v.x, v.y);
    }

    static detachedMove(v: Vectorlike) {
        Camera.position.set(v.x, v.y);
    }

    static glide(position: Vectorlike, grace = 9) {
        const x = (-position.x + Camera.position.x * (grace - 1)) / grace;
        const y = (-position.y + Camera.position.y * (grace - 1)) / grace;
        this.move({ x, y });
    }
}
