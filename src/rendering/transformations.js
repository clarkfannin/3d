import { config } from "../config.js";

export function translate(p, offset) {
    return { x: p.x + offset.dx, y: p.y + offset.dy, z: p.z + offset.dz };
}

export function scale(p, s) {
    return {x: p.x * s, y: p.y * s, z: p.z * s}
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
    };
}

export function rotateYZ(p, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x: p.x,
        y: p.y * c - p.z * s,
        z: p.y * s + p.z * c,
    };
}

export function modelToWorld(p, model, mesh) {
    function applyTransform(p, target) {
        let result = p;
        const t = target.pivot;
        if (t) result = translate(p, {dx: -t.x, dy: -t.y, dz: -t.z});
        result = scale(result, target.scale);
        result = rotateYZ(result, target.pitch);
        result = rotateXZ(result, target.yaw);
        if (t) result = translate(result, {dx: t.x, dy: t.y, dz: t.z});
        // offset result based on the model's displacement vector from origin
        return translate(result, { dx: target.x, dy: target.y, dz: target.z });
    }

    if (mesh) p = applyTransform(p, mesh);
    return applyTransform(p, model)
}

export function worldToCamera(p, camera, model) {
    // inverse of the camera
    let result = translate(p, { dx: -camera.x, dy: -camera.y, dz: -camera.z });
    result = rotateXZ(result, -camera.yaw);
    result = rotateYZ(result, -camera.pitch);
    return result;
}

export function cameraToClip(p) {
    return { x: p.x, y: p.y, z: p.z, w: p.z };
}

export function clipToNdc(p) {
    return { x: p.x / p.w, y: p.y / p.w, z: p.z };
}

export function ndcToScreen(p, halfWidth, halfHeight, scale) {
    return {
        x: halfWidth + scale * p.x,
        y: halfHeight - scale * p.y,
        z: p.z,
    };
}

export function vertexPipeline(point, model, mesh, camera, viewport) {
    const world = modelToWorld(point, model, mesh);
    const view = worldToCamera(world, camera, model);
    if (view.z <= config.near) return null;
    const clip = cameraToClip(view);
    const ndc = clipToNdc(clip);
    return ndcToScreen(ndc, viewport.halfWidth, viewport.halfHeight, viewport.scale);
}