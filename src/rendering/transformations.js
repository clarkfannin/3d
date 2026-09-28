import { config } from "../config.js";

export function translate(p, offset) {
    return { x: p.x + offset.dx, y: p.y + offset.dy, z: p.z + offset.dz, u: p.u, v: p.v };
}

export function scale(p, s) {
    return { x: p.x * s, y: p.y * s, z: p.z * s, u: p.u, v: p.v };
}

export function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

export function rotateXZ(p, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x: p.x * c - p.z * s,
        y: p.y,
        z: p.x * s + p.z * c,
        u: p.u,
        v: p.v,
    };
}

export function rotateYZ(p, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x: p.x,
        y: p.y * c - p.z * s,
        z: p.y * s + p.z * c,
        u: p.u,
        v: p.v,
    };
}

export function modelToWorld(p, model, mesh) {
    function applyTransform(p, target) {
        let result = p;
        const t = target.pivot;
        if (t) result = translate(p, { dx: -t.x, dy: -t.y, dz: -t.z });
        result = scale(result, target.scale);
        result = rotateYZ(result, target.pitch);
        result = rotateXZ(result, target.yaw);
        if (t) result = translate(result, { dx: t.x, dy: t.y, dz: t.z });
        // offset result based on the model's displacement vector from origin
        return translate(result, { dx: target.x, dy: target.y, dz: target.z });
    }

    if (mesh) p = applyTransform(p, mesh);
    return applyTransform(p, model);
}

export function worldToCamera(p, camera) {
    // inverse of the camera
    let result = translate(p, { dx: -camera.x, dy: -camera.y, dz: -camera.z });
    result = rotateXZ(result, -camera.yaw);
    result = rotateYZ(result, -camera.pitch);
    return result;
}

// plane z = near
export function clipNear(points, near) {
    const output = [];
    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        // wrap around to get first point if at last
        const b = points[(i + 1) % points.length];
        const aIsValid = a.z > near;
        const bIsValid = b.z > near;

        if (aIsValid) output.push(a);
        if (aIsValid !== bIsValid) {
            // how far along the edge is the line
            const distFromAtoNear = near - a.z;
            const distFromAtoB = b.z - a.z;
            const t = distFromAtoNear / distFromAtoB;
            output.push({
                x: lerp(a.x, b.x, t),
                y: lerp(a.y, b.y, t),
                z: near,
                u: lerp(a.u, b.u, t),
                v: lerp(a.v, b.v, t),
            });
        }
    }
    return output;
}

export function cameraToClip(p) {
    return { x: p.x, y: p.y, z: p.z, w: p.z, u: p.u, v: p.v };
}

export function clipToNdc(p) {
    return { x: p.x / p.w, y: p.y / p.w, z: p.z, u: p.u, v: p.v };
}

export function ndcToScreen(p, halfWidth, halfHeight, scale) {
    return {
        x: halfWidth + scale * p.x,
        y: halfHeight - scale * p.y,
        z: p.z,
        u: p.u,
        v: p.v
    };
}

export function convertModelToCameraSpace(p, model, mesh, camera) {
    const world = modelToWorld(p, model, mesh);
    return worldToCamera(world, camera, model);
}

export function convertCameraToScreenSpace(p, viewport) {
    const clip = cameraToClip(p);
    const ndc = clipToNdc(clip);
    return ndcToScreen(ndc, viewport.halfWidth, viewport.halfHeight, viewport.scale);
}