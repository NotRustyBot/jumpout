import { NetManager as SyncManager } from "./netManager";
import { BaseObject, SerialisedBaseObject } from "./baseObject";
import { AutoView, Datagram, datatype } from "./datagram";
import { ObjectScope } from "./objectScope";
import { SerialisedComponent, commonDatatype } from "./component";
import { NetComponent } from "./netComponent";

export type ComponentAuthority = {
    authority: number;
    id: number;
};

export type ComponentsRemoved = {
    removed: Array<{ id: number }>;
};

export type SerialisedSync = {
    components: Array<ComponentAuthority>;
};

export type SerialisedSyncComponent = SerialisedSync & SerialisedComponent;

class ComponentCacheInfo {
    component: NetComponent;
    cache: Record<number, number> = {};
    constructor(component: NetComponent) {
        this.component = component;
    }

    needsUpdate(target: number): boolean {
        const targetState = this.cache[target];
        if (targetState === this.component.cacheId) {
            return false;
        }
        this.cache[target] = this.component.cacheId;
        return true;
    }
}

export class Sync extends NetComponent {
    static localAuthority = new Set<Sync>();
    static componentAuthority = new Datagram().append<ComponentAuthority>({
        authority: datatype.uint32,
        id: commonDatatype.compId,
    });
    static componentRemoved = new Datagram().append<ComponentsRemoved>({
        removed: [datatype.array, new Datagram().addField("id", commonDatatype.compId)],
    });
    private cache = new Map<number, Map<number, ComponentCacheInfo>>();
    private exclusive = new Map<NetComponent, Set<number>>();

    get identity(): number {
        return SyncManager.identity;
    }

    static override datagramDefinition(): void {
        super.datagramDefinition();
        this.datagram = this.datagram.cloneAppend<SerialisedSync>({
            components: [datatype.array, this.componentAuthority],
        });
        this.cacheSize = this.componentAuthority.calculateMinimalSize() * 32;
    }

    override onRemove(): void {
        super.onRemove();
        Sync.localAuthority.delete(this);
    }

    componentRemoved(comp: NetComponent) {
        this.exclusive.delete(comp);
        for (const [auth, caches] of this.cache) {
            this.cache.get(auth).set(comp.id, undefined);
        }
    }

    authorize(components: NetComponent[], authority?: number) {
        const auth = authority ?? this.identity;
        if (!this.cache.get(auth)) this.cache.set(auth, new Map());
        for (const component of components) {
            this.cache.get(auth).set(component.id, new ComponentCacheInfo(component));
        }
    }

    hasAuthority(component: SerialisedComponent, authority?: number) {
        const auth = authority ?? this.identity;
        if (!this.cache.get(auth)) return false;
        return this.cache.get(auth).has(component.id);
    }

    exclusivity(components: NetComponent[], authority?: number) {
        const auth = authority ?? this.identity;
        for (const component of components) {
            if (!this.exclusive.get(component)) this.exclusive.set(component, new Set());
            this.exclusive.get(component).add(auth);
        }
    }

    clearCache(identity: number) {
        this.cache.delete(identity);
    }

    writeAuthorityBits(view: AutoView, target?: number) {
        const bindex = view.index;
        this.parent.writeHeaderBits(view, ObjectScope.network);
        const caches = this.cache.get(this.identity);
        const index = view.index;
        let actualSize = 0;
        view.writeUint8(caches.size);
        const toRemove: Array<{ id: number }> = [];
        for (const [id, cache] of caches) {
            if (!cache) {
                caches.delete(id);
                toRemove.push({ id });
                continue;
            }
            const exclusivity = this.exclusive.get(cache.component);
            if (target && exclusivity && !exclusivity.has(target)) continue;
            if (!target || cache.needsUpdate(target)) {
                cache.component.writeBits(view);
                actualSize++;
            }
        }

        view.setUint8(index, actualSize);

        Sync.componentRemoved.serialise<ComponentsRemoved>(view, { removed: toRemove });

        if (actualSize == 0 && toRemove.length == 0) {
            view.index = bindex;
            return false;
        }

        return true;
    }

    writeAllBits(view: AutoView, target?: number) {
        this.parent.writeHeaderBits(view, ObjectScope.network);
        const index = view.index;
        view.writeUint8(this.parent.netComponents.size);
        let actualSize = 0;
        for (const [id, comp] of this.parent.netComponents) {
            const exclusivity = this.exclusive.get(comp);
            if (target && exclusivity && !exclusivity.has(target)) continue;
            comp.writeBits(view);
            actualSize++;
        }
        view.setUint8(index, actualSize);
        Sync.componentRemoved.serialise<ComponentsRemoved>(view, { removed: [] });
    }

    static resolveBits(view: AutoView, links?: Map<number, number>) {
        const data = BaseObject.getHeaderFromBits(view) as SerialisedBaseObject;
        let parent = ObjectScope.network.getObject(data.id);
        data.componentData = [];
        const compCount = view.readUint8();
        if (!parent) {
            if (links && links.has(data.id)) {
                parent = ObjectScope.game.getObject(links.get(data.id));
                parent.clearComponents();
                links.delete(data.id);
                ObjectScope.network.setObject(parent, data.id);
            } else {
                parent = ObjectScope.game.createObject();
                ObjectScope.network.setObject(parent, data.id);
            }
        }

        for (let i = 0; i < compCount; i++) {
            const compData = NetComponent.dataFromBits(view);
            data.componentData.push(compData);
        }

        parent.applyData(data as SerialisedBaseObject);
        const toRemove = Sync.componentRemoved.deserealise<ComponentsRemoved>(view);
        for (const removee of toRemove.removed) {
            parent.removeComponentId(removee.id);
        }
        return parent;
    }

    static resolveUntrustedBits(view: AutoView, sender: number) {
        const data = BaseObject.getHeaderFromBits(view) as SerialisedBaseObject;
        let parent = ObjectScope.network.getObject(data.id);
        data.componentData = [];
        const compCount = view.readUint8();
        if (!parent) {
            parent = ObjectScope.game.createObject();
            ObjectScope.network.setObject(parent, data.id);
        }

        const sync = parent.getComponentByType(Sync);

        for (let i = 0; i < compCount; i++) {
            const compData = NetComponent.dataFromBits(view);
            if (sync.hasAuthority(compData, sender)) {
                data.componentData.push(compData);
            } else {
                console.warn("unauthorized data from " + sender);
            }
        }

        parent.applyData(data as SerialisedBaseObject);
        const toRemove = Sync.componentRemoved.deserealise<ComponentsRemoved>(view);
        for (const removee of toRemove.removed) {
            parent.removeComponentId(removee.id);
        }
        return parent;
    }

    override toSerialisable(): SerialisedSyncComponent {
        const data = super.toSerialisable() as SerialisedSyncComponent;
        const compas: Array<ComponentAuthority> = [];

        for (const [authority, caches] of this.cache) {
            for (const [id, cache] of caches) {
                if (cache) compas.push({ authority, id: cache.component.id });
            }
        }

        data.components = compas;
        return data;
    }

    override fromSerialisable(data: SerialisedSyncComponent) {
        super.fromSerialisable(data);
        for (const comp of data.components) {
            if (!this.cache.has(comp.authority)) this.cache.set(comp.authority, new Map());
            if (!this.cache.get(comp.authority).has(comp.id)) {
                const properComp: NetComponent = this.parent.getComponent(comp.id);
                if (properComp) this.cache.get(comp.authority).set(comp.id, new ComponentCacheInfo(properComp));
            }
        }
        this.considerLocalAuthority();
    }

    considerLocalAuthority() {
        if (this.cache.has(this.identity)) {
            Sync.localAuthority.add(this);
        } else {
            Sync.localAuthority.delete(this);
        }
    }

    override init(): void {
        this.considerLocalAuthority();
    }
}
