import { BaseObject } from "@shared/baseObject";
import { Detector, SerialisedDetectorComponent } from "./detector";
import { physicsLayerEnum, physicsLayers } from "../main";
import { RangeDetectable } from "./rangeDetectable";
import { Vector, Vectorlike } from "@shared/types";

export type SerialisedRangeDetector = {
    range: Vectorlike;
};

export type SerialisedRangeDetectorComponent = SerialisedRangeDetector & SerialisedDetectorComponent;

export class RangeDetector extends Detector {
    range = { x: 1000, y: 1000 };

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
    }

    override detect() {
        const areas = physicsLayers[physicsLayerEnum.detectable].getNearbyObjects(this.parent.position, this.range);

        for (const area of areas) {
            for (const rect of area) {
                const detectable = RangeDetectable.getByParent(rect.parent);
                if (detectable) this.detected(detectable);
            }
        }
    }

    override fromSerialisable(data: SerialisedRangeDetectorComponent): void {
        super.fromSerialisable(data);
        this.range = data.range;
    }

    override toSerialisable(): SerialisedRangeDetectorComponent {
        const data = super.toSerialisable() as SerialisedRangeDetectorComponent;
        data.range = this.range;
        return data;
    }
}
