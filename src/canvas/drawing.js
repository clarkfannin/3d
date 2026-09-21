export function convertPixel(imageData, width, x, y) {
    const i = (y * width + x) * 4;
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    return [r, g, b, a];
}
