import { AutoView, Datagram, Template, datatype } from "./datagram";
import { BaseObject } from "./baseObject";
import { bbid } from "./bbid";
import { Vectorlike } from "./types";
import { Component, SerialisedComponent } from "./component";


export class NetComponent extends Component {

    get datagram(): Datagram {
        return (<typeof NetComponent>this.constructor).datagram;
    }

    get cacheSize(): number {
        return (<typeof NetComponent>this.constructor).cacheSize;
    }


    static override initialise() {
        super.initialise();
        this.datagramDefinition();
        this.cacheSize += this.datagram.calculateMinimalSize();
    }

    static cacheSize = 0;
    static datagramDefinition() {
        this.datagram.append<SerialisedComponent>({
            typeId: datatype.uint16,
            id: datatype.uint8,
        });
    }

    static datagram: Datagram = new Datagram();

    cacheView: AutoView;
    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        parent.linkNetComponent(this);
        this.cacheView = AutoView.create(this.cacheSize);
    }

    override fromSerialisable(data: SerialisedComponent) {
        this.invalidateCache();
    }

    override onRemove(): void {
        this.parent.unlinkNetComponent(this);
    }

    invalidateCache() {
        this.cacheValid = false;
        this.cacheId++;
        if (this.cacheId > Number.MAX_SAFE_INTEGER) this.cacheId = 0;
    }

    isCacheValid() {
        return this.cacheValid;
    }

    private cacheValid = false;
    cacheId = 0;

    writeBits(view: AutoView) {
        if (!this.cacheValid) {
            this.cacheView.index = 0;
            this.datagram.serialise(this.cacheView, this.toSerialisable());
        }
        view.append(this.cacheView);
    }


    static dataFromBits(view: AutoView): SerialisedComponent {
        const typeId = view.getUint16(view.index);
        if(typeId == 0) return undefined;
        return (this.componentTypes[typeId] as typeof NetComponent).datagram.deserealise(view);
    }
}