import { BaseObject } from "@shared/baseObject";
import { Detector, SerialisedDetectorComponent } from "./detector";
import { physicsLayerEnum, physicsLayers } from "../main";
import { RangeDetectable } from "./rangeDetectable";

export type SerialisedMarkerDetector = {
};

export type SerialisedMarkerDetectorComponent = SerialisedMarkerDetector & SerialisedDetectorComponent;

export class MarkerDetector extends Detector {
    constructor(parent: BaseObject, id: number) {
        super(parent, id);
    }

    override detect() {
        const area = physicsLayers[physicsLayerEnum.marker].getObjects(this.parent.position);

        for (const rect of area) {
            const detectable = RangeDetectable.getByParent(rect.parent);
            if (detectable) this.detected(detectable);
        }
    }

    override fromSerialisable(data: SerialisedMarkerDetectorComponent): void {
        super.fromSerialisable(data);
    }

    override toSerialisable(): SerialisedMarkerDetectorComponent {
        const data = super.toSerialisable() as SerialisedMarkerDetectorComponent;
        return data;
    }
}
