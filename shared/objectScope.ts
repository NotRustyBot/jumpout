import { BaseObject, SerialisedBaseObject } from "./baseObject";
import { Serialisable } from "./component";
import { IncidentRotuer, trippable } from "./incident";


type SerialisedObjectScope = {
    id: number,
    objectIndex: number,
    objects: Array<SerialisedBaseObject>
}



export class ObjectScope {
    private static scopes = new Map<number, ObjectScope>();
    incidentRouter = new IncidentRotuer();
    objectIndex = 0;
    id: number
    baseObjects = new Map<number, BaseObject>();

    static game = new ObjectScope(0);
    static debug = new ObjectScope(-1);
    static network = new ObjectScope(1);

    constructor(id: number) {
        this.id = id;
        ObjectScope.scopes.set(id, this);
    }

    static get(id: number){
        return this.scopes.get(id);
    }

    createObject() {
        const object = new BaseObject();
        this.scopeObject(object);
        return object;
    }

    subscribe<K extends string>(name: K, component: trippable<K>) {
        this.incidentRouter.subscribe(name, component);
    }

    unsubscribe<K extends string>(name: K, component: trippable<K>) {
        this.incidentRouter.unsubscribe(name, component);
    }

    fire(name: string, params?: any) {
        this.incidentRouter.fire(name, params);
    }

    scopeObject(object: BaseObject) {
        this.baseObjects.set(this.objectIndex, object);
        object.cacheScope(this, this.objectIndex);
        this.objectIndex++;
    }

    setObject(object: BaseObject, id: number) {
        this.baseObjects.set(id, object);
        object.cacheScope(this, id);
    }

    unscopeObject(object: BaseObject) {
        const id = object.getId(this);
        if (id != undefined) {
            this.baseObjects.get(id)?.uncacheScope(this);
            this.baseObjects.delete(id);
        }
    }

    toSerialisable(): Serialisable {
        return { id: this.id, objectIndex: this.objectIndex }
    }

    toDeepSerialisable(): Serialisable {
        const data = this.toSerialisable();
        const objects: Array<Serialisable> = [];

        for (const [id, object] of this.baseObjects) {
            objects.push(object.toDeepSerialisable(this));
        }

        data["objects"] = objects;
        return data
    }

    getObject(id: number): BaseObject {
        return this.baseObjects.get(id);
    }

    clear(){
        this.objectIndex = 0;
        this.baseObjects = new Map<number, BaseObject>();
    }

    applySerialisable(scopeData: SerialisedObjectScope){
        this.objectIndex = scopeData.objectIndex;

        for (const objData of scopeData.objects) {
            const object = new BaseObject();
            this.setObject(object, objData.id);
            object.applyData(objData);
        }
    }

    static fromSerialisable(data: Serialisable) {
        const scopeData = data as SerialisedObjectScope
        const id = scopeData.id;
        const scope = new ObjectScope(id);
        scope.applySerialisable(scopeData);

        return scope;
    }
}