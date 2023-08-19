import { AutoView, Datagram, Template, datatype } from "./datagram";
import { BaseObject } from "./baseObject";
import { bbid } from "./bbid";
import { Vectorlike } from "./types";

export type Serialisable = {
    [k: string]: SerialisableValue;
};

export type SerialisableValue = number | string | Vectorlike | Array<number> | Array<string> | Array<Serialisable>;

export interface SerialisedComponent {
    typeId: number;
    id: number;
}

export const commonDatatype = {
    typeId: datatype.uint16,
    compId: datatype.uint8,
    objectId: datatype.uint16,
    color: datatype.uint32,
    userId: datatype.uint32,
    missionId: datatype.uint16,
};

export class Component {
    static componentTypes: Record<number, typeof Component> = {};
    static typeId: number;
    get typeId(): number {
        return (<typeof Component>this.constructor).typeId;
    }

    parent: BaseObject;
    id: number;

    static initialise() {
        this.typeId = bbid(this.name);
        this.componentTypes[this.typeId] = this;
    }

    constructor(parent: BaseObject, id: number) {
        this.parent = parent;
        this.id = id;
    }

    onRemove() {}

    toSerialisable(): SerialisedComponent {
        const data: SerialisedComponent = { id: this.id, typeId: this.typeId };
        return data;
    }

    fromSerialisable(data: SerialisedComponent) {}

    init() {}

    typeName() {
        return Component.componentTypes[this.typeId].name;
    }

    static createFromObject(parent: BaseObject, data: SerialisedComponent) {
        const constructor = this.componentTypes[data.typeId];
        if(!constructor) throw new Error(data.typeId + " is not a valid component type id");
        const component = new constructor(parent, data.id);
        return component;
    }
}
