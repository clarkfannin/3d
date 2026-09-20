export function translateZ({ x, y, z }, dz) {
    // TODO: handle y position offset based on midpoint of coordinates in obj
    // for now i just subtract 2 from y
    return applyZ({ x: x, y: y - 2, z: z + dz });
};

export function applyZ({ x, y, z }) {
    return { x: x / z, y: y / z, z: z };
};

export function rotateXZ({ x, y, z }, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x: x * c - z * s,
        y,
        z: x * s + z * c,
    };
};

export function convertToCanvas({ x, y, z }, halfX, halfY) {
    return {
        x: halfX + halfX * x,
        y: halfY - halfY * y,
        z,
    };
};