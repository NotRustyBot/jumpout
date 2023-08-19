import { AutoView, Datagram, datatype } from "./datagram";

export type HandshakeRequest = {
    clientId: number;
    secret: string;
};

export type HandshakeReply = {
    clientId: number;
    response: string;
    motd: string;
};

export type GasDatum = { index: number; value: number };

export type GasData = {
    data: Array<GasDatum>;
};

export enum headerId {
    handshake = 1,
    message = 2,
    objects = 10,
    gas = 11,
}

export class NetManager {
    static connectRequest = new Datagram();
    static connectReply = new Datagram();
    static gas = new Datagram();
    static identity = 0;

    static initDatagrams() {
        this.connectRequest.append<HandshakeRequest>({
            clientId: datatype.uint32,
            secret: datatype.string,
        });

        this.connectReply.append<HandshakeReply>({
            clientId: datatype.uint32,
            response: datatype.string,
            motd: datatype.string,
        });

        this.gas.append<GasData>({
            data: [
                datatype.array,
                new Datagram().append<GasDatum>({
                    index: datatype.uint32,
                    value: datatype.uint8,
                }),
            ],
        });
    }

    static makeId(length: number = 12) {
        let result = "";
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
