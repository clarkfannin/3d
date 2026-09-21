export function edge(pixel, v0, v1) {
    const result = (pixel.x - v0.x) * (v1.y - v0.y) - (pixel.y - v0.y) * (v1.x - v0.x);
    return result;
}

export function pointInTriangle(x, y, [v0, v1, v2]) {
    return edge({ x, y }, v0, v1) >= 0 && edge({ x, y }, v1, v2) >= 0 && edge({ x, y }, v2, v0) >= 0;
}

const dist = (v0, v1) => {
    return Math.sqrt(Math.pow(v1.x - v0.x, 2) + Math.pow(v1.y - v0.y, 2));
};

const area = (s, edge0, edge1, edge2) => {
    return Math.sqrt(s * (s - edge0) * (s - edge1) * (s - edge2));
};

export function interpolate ({ w0, w1, w2 }, a0, a1, a2) {
    return w0 * a0 + w1 * a1 + w2 * a2;
};

export function barycentric(point, v0, v1, v2) {
    //outer edges
    const edgeOuter0 = dist(v0, v1);
    const edgeOuter1 = dist(v1, v2);
    const edgeOuter2 = dist(v2, v0);
    //inner edges
    const edgeInner0 = dist(point, v0);
    const edgeInner1 = dist(point, v1);
    const edgeInner2 = dist(point, v2);

    const sOuter = (edgeOuter0 + edgeOuter1 + edgeOuter2) / 2;
    const sInner0 = (edgeOuter0 + edgeInner0 + edgeInner1) / 2;
    const sInner1 = (edgeOuter1 + edgeInner1 + edgeInner2) / 2;
    const sInner2 = (edgeOuter2 + edgeInner2 + edgeInner0) / 2;

    const areaOuter = area(sOuter, edgeOuter0, edgeOuter1, edgeOuter2);
    const areaInner0 = area(sInner0, edgeOuter0, edgeInner0, edgeInner1);
    const areaInner1 = area(sInner1, edgeOuter1, edgeInner1, edgeInner2);
    const areaInner2 = area(sInner2, edgeOuter2, edgeInner2, edgeInner0);

    // each weight is the area of the sub-triangle opposite its vertex
    const w0 = areaInner1 / areaOuter;
    const w1 = areaInner2 / areaOuter;
    const w2 = areaInner0 / areaOuter;

    return {
        w0,
        w1,
        w2,
    };
}
