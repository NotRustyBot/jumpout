import { AutoView } from "@shared/datagram";
import { GasManager } from "@shared/gasManager";
import { GasData, NetManager, headerId } from "@shared/netManager";
import { Vectorlike } from "@shared/types";

export class ClientGasManager extends GasManager {
    serverGas: GasManager;
    data: Array<{ index: number; value: number }> = [];
    constructor(serverGas: GasManager) {
        super();
        this.serverGas = serverGas;
    }

    checkGas(coords: Vectorlike, radius: number) {
        coords = GasManager.worldToGas(coords);
        radius = radius / GasManager.gasScale;
        for (let x = coords.x - radius; x <= coords.x + radius; x++) {
            for (let y = coords.y - radius; y <= coords.y + radius; y++) {
                if (isWithinCircle(coords.x, coords.y, x, y, radius)) {
                    const index = GasManager.gasToIndex({ x, y });
                    const value = this.serverGas.getIndex(index);
                    if (value != this.getIndex(index)) {
                        this.setIndex(index, value);
                        this.data.push({ index, value });
                    }
                }
            }
        }
    }

    serialiseAll(view: AutoView) {
        view.writeUint16(headerId.gas);
        NetManager.gas.serialise<GasData>(view, {
            data: [...this.level.entries()].map(([index, value]) => ({
                index,
                value,
            })),
        });
    }

    serialise(view: AutoView) {
        view.writeUint16(headerId.gas);
        NetManager.gas.serialise<GasData>(view, this);
        this.data = [];
    }
}

function isWithinCircle(centerX: number, centerY: number, x: number, y: number, radius: number): boolean {
    return Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2) <= radius ** 2;
}
