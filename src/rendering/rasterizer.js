export function edge(pixel, v0, v1) {
    const result = (pixel.x - v0.x) * (v1.y - v0.y) - (pixel.y - v0.y) * (v1.x - v0.x);
    return result;
}

export function pointInTriangle(x, y, [v0, v1, v2]) {
    return edge({ x, y }, v0, v1) >= 0 && edge({ x, y }, v1, v2) >= 0 && edge({ x, y }, v2, v0) >= 0;
}