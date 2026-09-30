export function edge(pixel, v0, v1) {
    const result = (pixel.x - v0.x) * (v1.y - v0.y) - (pixel.y - v0.y) * (v1.x - v0.x);
    return result;
}

export function pointInTriangle(e0, e1, e2) {
    return e0 > 0 && e1 > 0 && e2 > 0;
}

export function dist (v0, v1) {
    return Math.sqrt((v1.x - v0.x) ** 2  + (v1.y - v0.y) ** 2);
};

export function interpolate ({ w0, w1, w2 }, a0, a1, a2) {
    return w0 * a0 + w1 * a1 + w2 * a2;
};
