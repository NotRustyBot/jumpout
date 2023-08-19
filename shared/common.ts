import { defineParts } from "./partDefinitions";
import { Part } from "./parts/part";
import { Layer } from "./physics/chunks";
import { SubStats } from "./stats";

export let terrainLayer: Layer;
export let fishLayer: Layer;
export let submarineLayer: Layer;
export let beaconLayer: Layer;

export function initCommon() {
    terrainLayer = new Layer();
    fishLayer = new Layer();
    submarineLayer = new Layer();
    beaconLayer = new Layer();

    defineParts();
}

export enum partSlot {
    hull = 1,
    system = 2,
    command = 3,
}

export enum partActions {
    deployBeacon = 1,
    enableSonar = 2,
    disableSonar = 3,
    deployBait = 4,
}

type subPart = {
    name: string;
    desc: string;
    type: partTypes;
    strain: number;
    slot: partSlot;
    modification?: SubStats;
    actions?: Array<actionButtonInfo>;
};

export enum partTypes {
    ballast = 0,
    smallRovHull = 1,
    largeRovHull = 2,
    smallHovHull = 3, //~5ppl
    modalHovHull = 4, //~15ppl
    largeHovHull = 5, //~50ppl
    giantHovHull = 6, //~120ppl

    basicEngine = 7,
    basicPump = 8,
    battery = 9,
    beaconDeployer = 10,
    floodlight = 11,
    sonar = 12,
    fishFeeder = 13,
}

export type actionButtonInfo = {
    image: string;
    name: string;
};

export class SubmarinePart {
    private static parts = new Map<partTypes, SubmarinePart>();
    slot: partSlot;
    modification: SubStats;
    actions: Array<actionButtonInfo> = [];
    type: partTypes;

    constructor(data: subPart) {
        this.slot = data.slot;
        this.actions = data.actions ?? [];
        this.modification = data.modification ?? new SubStats({});
        this.type = data.type;
    }

    static create(data: subPart) {
        const part = new SubmarinePart(data);
        this.parts.set(data.type, part);
    }

    static get(type: partTypes): SubmarinePart {
        return this.parts.get(type);
    }
}

export type SubmarineAssembly = {
    part: SubmarinePart;
    count: number;
};
