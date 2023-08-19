import { GasManager } from "@shared/gasManager";
import { Vector, Vectorlike } from "@shared/types";
import { SimplexNoise } from "ts-perlin-simplex";
import { ClientGasManager } from "./clientGas";

export let gasManager: GasManager;
export let clientGasManager: ClientGasManager;
export function setupGas() {
    gasManager = new GasManager();
    clientGasManager = new ClientGasManager(gasManager);
    const simplex = new SimplexNoise();
    for (let y = -50; y < 50; y++) {
        for (let x = -50; x < 50; x++) {
            gasManager.setGas(new Vector(x, y), Math.floor(simplex.noise(x, y) * 255));
        }
    }
}
