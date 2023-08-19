import { commonDatatype } from "./component";
import { AutoView, Datagram, datatype } from "./datagram";
import { headerId } from "./netManager";
import { Vector, Vectorlike } from "./types";

export enum messageType {
    tick = 2,
    untrackObject = 3,
    debugCam = 4,
    debugCamPosition = 5,
    partActivity = 6,
    partActivityLinked = 7,
    objectLink = 8,
    partActivityPositioned = 9,
    partActivityLinkedPositioned = 10,
    actionFailed = 11,
    actionFailedLinked = 12,
    devDelete = 13,
    //componentRemoved = 14,
    standing = 15,
}

export type netMessage =
    | tickMessage
    | untrackObjectMessage
    | debugCamMessage
    | debugCamPositionMessage
    | partActivityMessage
    | partActivityLinkedMessage
    | objectLinkMessage
    | partActivityLinkedMessage
    | partActivityLinkedPositionedMessage
    | actionFailedMessage
    | actionFailedLinkedMessage
    | devDeleteMessage
    | standingMessage

type tickMessage = {
    typeId: messageType.tick;
};

type untrackObjectMessage = {
    typeId: messageType.untrackObject;
    objectId: number;
};

type debugCamMessage = {
    typeId: messageType.debugCam;
    enabled: number;
};

type debugCamPositionMessage = {
    typeId: messageType.debugCamPosition;
    position: Vector;
    range: Vector;
};

type partActivityMessage = {
    typeId: messageType.partActivity;
    objectId: number;
    action: number;
};

type partActivityLinkedMessage = {
    typeId: messageType.partActivityLinked;
    objectId: number;
    linkId: number;
    action: number;
};

type objectLinkMessage = {
    typeId: messageType.objectLink;
    netId: number;
    linkId: number;
};

type partActivityPositionedMessage = {
    typeId: messageType.partActivityPositioned;
    objectId: number;
    position: Vectorlike;
    action: number;
};

type partActivityLinkedPositionedMessage = {
    typeId: messageType.partActivityLinkedPositioned;
    objectId: number;
    position: Vectorlike;
    linkId: number;
    action: number;
};

type actionFailedMessage = {
    typeId: messageType.actionFailed;
    text: string;
};

type actionFailedLinkedMessage = {
    typeId: messageType.actionFailedLinked;
    text: string;
    linkId: number;
};

type devDeleteMessage = {
    typeId: messageType.devDelete;
    objectId: number;
};

type standingMessage = {
    typeId: messageType.standing;
    change: number;
    reason: string
};

const messageIdDataType = datatype.uint8;

export class Message {
    private static datagrams: Record<messageType, Datagram> = {
        [messageType.tick]: new Datagram().append<tickMessage>({
            typeId: messageIdDataType,
        }),

        [messageType.untrackObject]: new Datagram().append<untrackObjectMessage>({
            typeId: messageIdDataType,
            objectId: commonDatatype.objectId,
        }),
        [messageType.debugCam]: new Datagram().append<debugCamMessage>({
            typeId: messageIdDataType,
            enabled: datatype.uint8,
        }),
        [messageType.debugCamPosition]: new Datagram().append<debugCamPositionMessage>({
            typeId: messageIdDataType,
            position: datatype.vector32,
            range: datatype.vector32,
        }),
        [messageType.partActivity]: new Datagram().append<partActivityMessage>({
            typeId: messageIdDataType,
            objectId: commonDatatype.objectId,
            action: datatype.uint8,
        }),
        [messageType.partActivityLinked]: new Datagram().append<partActivityLinkedMessage>({
            typeId: messageIdDataType,
            objectId: commonDatatype.objectId,
            linkId: commonDatatype.objectId,
            action: datatype.uint8,
        }),
        [messageType.objectLink]: new Datagram().append<objectLinkMessage>({
            typeId: messageIdDataType,
            linkId: commonDatatype.objectId,
            netId: commonDatatype.objectId,
        }),
        [messageType.partActivityPositioned]: new Datagram().append<partActivityPositionedMessage>({
            typeId: messageIdDataType,
            action: datatype.uint8,
            position: datatype.vector32,
            objectId: commonDatatype.objectId,
        }),
        [messageType.partActivityLinkedPositioned]: new Datagram().append<partActivityLinkedPositionedMessage>({
            typeId: messageIdDataType,
            action: datatype.uint8,
            position: datatype.vector32,
            objectId: commonDatatype.objectId,
            linkId: commonDatatype.objectId,
        }),
        [messageType.actionFailed]: new Datagram().append<actionFailedMessage>({
            typeId: messageIdDataType,
            text: datatype.string,
        }),
        [messageType.actionFailedLinked]: new Datagram().append<actionFailedLinkedMessage>({
            typeId: messageIdDataType,
            text: datatype.string,
            linkId: commonDatatype.objectId,
        }),
        [messageType.devDelete]: new Datagram().append<devDeleteMessage>({
            typeId: messageIdDataType,
            objectId: commonDatatype.objectId,
        }),
        [messageType.standing]: new Datagram().append<standingMessage>({
            typeId: messageIdDataType,
            change: datatype.float32,
            reason: datatype.string
        }),
    };
    static write<T extends netMessage>(view: AutoView, data: T) {
        const typeId = data.typeId;
        view.writeUint16(headerId.message);
        this.datagrams[typeId].serialise(view, data);
    }

    static read(view: AutoView): netMessage {
        const typeId: messageType = view.getUint8(view.index);
        let message: netMessage = this.datagrams[typeId].deserealise(view);

        return message;
    }
}
