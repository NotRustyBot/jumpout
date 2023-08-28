import { GasManager } from "@shared/gasManager";
import { Vector } from "@shared/types";
import { SimplexNoise } from "ts-perlin-simplex";
import { ClientGasManager } from "./clientGas";
const scale = 50;
export let gasManager: GasManager;
export let clientGasManager: ClientGasManager;
export function setupGas() {
    gasManager = new GasManager();
    clientGasManager = new ClientGasManager(gasManager);
    const simplex = new SimplexNoise();
    for (let y = -50; y < 50; y++) {
        for (let x = -50; x < 50; x++) {
            gasManager.setGas(new Vector(x, y), Math.abs(Math.floor(simplex.noise((x + 1000) / scale, y / scale) - simplex.noise(x / scale, y / scale) * 255)));
        }
    }
}
