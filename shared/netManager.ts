import { AutoView, Datagram, datatype } from "./datagram";

export type HandshakeRequest = {
    clientId: number;
    secret: string;
}

export type HandshakeReply = {
    clientId: number;
    response: string;
    motd: string;
}


export enum headerId {
    handshake = 1,
    objects = 10,
    message = 2,
}


export class NetManager {
    static connectRequest = new Datagram();
    static connectReply = new Datagram();
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