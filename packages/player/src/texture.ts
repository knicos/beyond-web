import {DataTexture, Color, RGBAFormat} from 'three';

const CIRCLE_SIZE = 32;

export function createCircleTexture(color: Color): DataTexture {
    const size = CIRCLE_SIZE * CIRCLE_SIZE;
    const RADIUS = CIRCLE_SIZE / 2;
    const RADIUS2 = RADIUS * RADIUS;
    const data = new Uint8Array(4 * size);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    let i = 0;
    for (let y = -RADIUS; y < RADIUS; ++y) {
        for (let x = -RADIUS; x < RADIUS; ++x) {
            const inCircle = x * x + y * y <= RADIUS2;
            data[i++] = r;
            data[i++] = b;
            data[i++] = g;
            data[i++] = inCircle ? 255 : 0;
        }
    }

    return new DataTexture(data, CIRCLE_SIZE, CIRCLE_SIZE, RGBAFormat);
}
