import { BaseObject } from "../baseObject";
import { NetComponent } from "../netComponent";
import { datatype } from "../datagram";
import { SerialisedComponent } from "../component";

export enum drawableExtra {
    background = 0,
    terrain = 1,
    entity = 2,
    lights = 3,
}

export type SerialisedDrawable = {
    url: string;
    extra: number;
};

export type SerialisedDrawableComponent = SerialisedDrawable & SerialisedComponent;

export class Drawable extends NetComponent {
    url!: string;
    extra!: number;

    static override datagramDefinition(): void {
        this.datagram = super.datagram.cloneAppend<SerialisedDrawable>({
            url: datatype.string,
            extra: datatype.uint8,
        });
        this.cacheSize = 2 * 64 + 1;
    }

    override toSerialisable(): SerialisedDrawableComponent {
        const data = super.toSerialisable() as SerialisedDrawableComponent;
        data.url = this.url;
        data.extra = this.extra;
        return data;
    }

    override fromSerialisable(data: SerialisedDrawableComponent) {
        super.fromSerialisable(data);
        this.url = data.url;
        this.extra = data.extra;
    }
}
