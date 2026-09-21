import { state } from "../state.js";
import { config } from "../config.js";

export function convertPixel(imageData, width, x, y) {
    const i = (y * width + x) * 4;
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    return [r, g, b, a];
}

export function placePixel(x, y, [r, g, b, a]) {
    // index in the global pixel buffer, [r, g, b, a, r, g, b, a...]
    const index = (y * config.width + x) * 4;
    state.sceneImageData.data[index] = r;
    state.sceneImageData.data[index + 1] = g;
    state.sceneImageData.data[index + 2] = b;
    state.sceneImageData.data[index + 3] = a;
}
