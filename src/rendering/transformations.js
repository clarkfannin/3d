export function translateZ({ x, y, z }, dz) {
    return applyZ({ x, y, z: z + dz });
}

export function applyZ({ x, y, z }) {
    return { x: x / z, y: y / z, z: z };
}

export function rotateXZ({ x, y, z }, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x: x * c - z * s,
        y,
        z: x * s + z * c,
    };
}

export function convertToCanvas({ x, y, z }, halfCanvasWidth, halfCanvasHeight, scale) {
    return {
        x: halfCanvasWidth + scale * x,
        y: halfCanvasHeight - scale * y,
        z,
    };
}
