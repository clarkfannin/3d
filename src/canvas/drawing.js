import { state } from "../state.js";
import { config } from "../config.js";
import { events } from "../events/event-manager.js";

export function convertPixel(imageData, width, x, y) {
    if (!imageData) return;
    const i = (y * width + x) * 4;
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    return [r, g, b, a];
}

export function placePixel(x, y, [r, g, b, a]) {
    // index in the global pixel buffer, [r, g, b, a, r, g, b, a...]
    if (!a) return;
    const index = (y * config.width + x) * 4;
    state.sceneImageData.data[index] = r + state.tint.r + 20;
    state.sceneImageData.data[index + 1] = g + state.tint.g;
    state.sceneImageData.data[index + 2] = b + state.tint.b;
    state.sceneImageData.data[index + 3] = a + state.tint.a;
}

export function tintRed() {
    state.tint.r += 20;
}
export function tintGreen() {
    state.tint.g += 20;
}
export function tintBlue() {
    state.tint.b += 20;
}

events.subscribe(tintBlue, "threshold")
events.subscribe(tintGreen, "time")
