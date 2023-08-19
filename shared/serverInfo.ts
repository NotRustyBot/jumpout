import { BaseObject } from "./baseObject";
import {  NetComponent } from "./netComponent";
import { datatype } from "./datagram";
import { SerialisedComponent } from "./component";

export type SerialisedServerInfo = {
    playerCount: number;
    mode: number;
    tickTime: number;
    sendBuffer: number;
    time: number;
}

export type SerialisedServerInfoComponent = SerialisedServerInfo & SerialisedComponent;

export enum serverMode {
    update = 0,
    pause = 1
}

export class ServerInfo extends NetComponent {

    private _playerCount = 0;
    tickTime = 0;
    sendBuffer = 0;
    time = 0;

    public get playerCount(): number {
        return this._playerCount
    }

    public set playerCount(v: number) {
        this.invalidateCache();
        this._playerCount = v;
    }

    private _mode = serverMode.update;

    public get mode(): number {
        return this._mode
    }

    public set mode(v: number) {
        this.invalidateCache();
        this._mode = v;
    }

    private _tick = 0;

    public get tick(): number {
        return this._tick
    }

    public set tick(v: number) {
        this.invalidateCache();
        this._tick = v;
    }


    static instance: ServerInfo;
    static get() {
        return this.instance;
    }

    static override initialise(): void {
        super.initialise();
    }

    constructor(parent: BaseObject, id: number) {
        super(parent, id);
        ServerInfo.instance = this;
    }

    static override datagramDefinition(): void {
        super.datagramDefinition();
        this.datagram = this.datagram.cloneAppend<SerialisedServerInfo>({
            mode: datatype.uint8,
            playerCount: datatype.uint16,
            tickTime: datatype.float32,
            sendBuffer: datatype.uint32,
            time: datatype.float32,
        });
        this.cacheSize = 0;
    }

    override toSerialisable(): SerialisedServerInfoComponent {
        const data = super.toSerialisable() as SerialisedServerInfoComponent;
        data.mode = this._mode;
        data.playerCount = this._playerCount;
        data.tickTime = this.tickTime;
        data.sendBuffer = this.sendBuffer;
        data.time = this.time;
        return data;
    }

    override fromSerialisable(data: SerialisedServerInfoComponent) {
        super.fromSerialisable(data);
        this.mode = data.mode;
        this.playerCount = data.playerCount;
        this.tickTime = data.tickTime;
        this.sendBuffer = data.sendBuffer;
        this.time = data.time;
    }
}

