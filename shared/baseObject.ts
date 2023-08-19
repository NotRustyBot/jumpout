import { AutoView, Datagram, datatype } from "./datagram";
import { ObjectScope } from "./objectScope";
import { Vector } from "./types";
import { Transform } from "./transform";
import { Component, Serialisable, SerialisedComponent } from "./component";
import { NetComponent } from "./netComponent";
import { Sync } from "./sync";

export type SerialisedBaseObject = {
    id: number;
    componentIndex: number;
    componentData: Array<SerialisedComponent>;
} & Serialisable;

export type SerialisedBaseObjectHeader = {
    componentIndex: number;
    id: number;
};

export class BaseObject {
    static objectDatagram = new Datagram().append<SerialisedBaseObjectHeader>({
        componentIndex: datatype.uint8,
        id: datatype.uint16,
    });

    constructor() {
        BaseObject.attach(this);
    }

    static attach = (baseobject: BaseObject) => {};
    static detach = (baseobject: BaseObject) => {};

    private scopes = new Map<number, number>();
    components = new Map<number, Component>();
    netComponents = new Map<number, NetComponent>();
    componentIndex = 0;
    transform!: Transform;

    get position(): Vector {
        return this.transform.position;
    }

    get rotation(): number {
        return this.transform.rotation;
    }

    public set rotation(v: number) {
        this.transform.rotation = v;
    }

    cacheScope(scope: ObjectScope, id: number) {
        this.scopes.set(scope.id, id);
    }

    getId(scope: ObjectScope) {
        return this.scopes.get(scope.id);
    }

    uncacheScope(scope: ObjectScope) {
        this.scopes.delete(scope.id);
    }

    linkNetComponent(netComponent: NetComponent) {
        this.netComponents.set(netComponent.id, netComponent);
    }

    unlinkNetComponent(netComponent: NetComponent) {
        this.netComponents.delete(netComponent.id);
        const sync = this.getComponentByType(Sync);
        if (sync) sync.componentRemoved(netComponent);
    }

    addComponent<T extends Component>(type: { new (parent: BaseObject, index: number): T }) {
        const component = new type(this, this.componentIndex);
        this.componentIndex++;
        return this.setComponent(component) as T;
    }

    setComponent(component: Component) {
        if (component instanceof Transform) this.transform = component;
        this.components.set(component.id, component);
        return component;
    }

    removeComponent(component: Component) {
        component.onRemove();
        this.components.delete(component.id);
    }

    getComponent<T extends Component>(id: number) {
        return this.components.get(id) as T;
    }

    removeComponentId(id: number) {
        const comp = this.getComponent(id);
        if (comp) this.removeComponent(comp);
    }

    getComponentByType<T extends Component>(type: { new (parent: BaseObject, index: number): T; typeId: number }): T | undefined {
        for (const [id, component] of this.components) {
            if (component.typeId == type.typeId) return component as T;
        }
        return undefined;
    }

    toSerialisable(scope?: ObjectScope): SerialisedBaseObject {
        const data: SerialisedBaseObject = { id: scope ? this.getId(scope) : -1, componentIndex: this.componentIndex, componentData: [] };
        return data;
    }

    toDeepSerialisable(scope?: ObjectScope): SerialisedBaseObject {
        const data = this.toSerialisable(scope);
        const components: Array<SerialisedComponent> = [];

        for (const [id, component] of this.components) {
            components.push(component.toSerialisable());
        }

        data["componentData"] = components;
        return data;
    }

    clearComponents() {
        for (const [id, component] of this.components) {
            component.onRemove();
        }
        this.components.clear();
    }

    remove() {
        this.clearComponents();
        for (const [scopeId, id] of this.scopes) {
            ObjectScope.get(scopeId).unscopeObject(this);
        }
        BaseObject.detach(this);
    }

    writeHeaderBits(view: AutoView, scope: ObjectScope) {
        BaseObject.objectDatagram.serialise(view, this.toSerialisable(scope));
    }

    static getHeaderFromBits(view: AutoView): SerialisedBaseObjectHeader {
        return BaseObject.objectDatagram.deserealise(view);
    }

    applyData(data: SerialisedBaseObject) {
        const dataCache = new Map<number, SerialisedComponent>();
        const createdComps = new Array<Component>();
        for (const componentData of data.componentData) {
            if (!this.getComponent(componentData.id)) {
                const component = Component.createFromObject(this, componentData);
                this.setComponent(component);
                createdComps.push(component);
            }
            dataCache.set(componentData.id, componentData);
        }

        for (const [id, component] of dataCache) {
            this.components.get(id).fromSerialisable(component);
        }

        this.componentIndex = data.componentIndex;

        for (const component of createdComps) {
            component.init();
        }
    }

    initialiseComponents() {
        for (const [id, comp] of this.components) {
            comp.init();
        }
    }
}
