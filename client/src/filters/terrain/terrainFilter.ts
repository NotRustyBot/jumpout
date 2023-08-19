import { Filter } from '@pixi/core';
import type { FilterSystem, RenderTexture, CLEAR_MODES } from '@pixi/core';
import vertex from './terrain.vert';
import fragment from './terrain.frag';
import { currentSubPos, time } from '../../index';
import { Camera } from '../../camera';

export class TerrainFilter extends Filter {
    constructor() {
        super(vertex, fragment);
        this.uniforms.uTime = 0;
        this.uniforms.uCoords = [0, 0];
    }

    override apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void {
        this.uniforms.uTime = time;

        this.uniforms.uCoords = [(currentSubPos.x + Camera.position.x) * Camera.scale + Camera.size.x / 2, (currentSubPos.y + Camera.position.y) * Camera.scale + Camera.size.y / 2];
        this.uniforms.uCamera = [Camera.position.x, Camera.position.y];
        this.uniforms.uRange = 2000;
        this.uniforms.uScale = Camera.scale;
        filterManager.applyFilter(this, input, output, clear);
    }
}
