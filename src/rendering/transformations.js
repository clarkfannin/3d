import { config } from "../config.js";

export function translate(p, offset) {
    return { x: p.x + offset.dx, y: p.y + offset.dy, z: p.z + offset.dz };
}

// at one of these stages i need to check against the near plane.
// if the plane is defined as z=0 and the positive direction is away from the screen,
// then points with a negative z should be set to null.
// in canvasPoints if the array contains a point with negative z it will be skipped

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

export function modelToWorld(p, model) {
    let result = rotateYZ(p, model.pitch);
    result = rotateXZ(result, model.yaw)
    // offset result based on the model's displacement vector from origin
    return translate(result, { dx: model.x, dy: model.y, dz: model.z });
}

export function worldToCamera(world, camera) {
    // inverse of the camera
    let result = translate(world, {dx: -camera.x, dy: -camera.y, dz: -camera.z})
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

export function vertexPipeline(point, model, camera, viewport) {
    const world = modelToWorld(point, model, camera);
    const view = worldToCamera(world, camera);
    if (view.z <= config.near) return null;
    const clip = cameraToClip(view);
    const ndc = clipToNdc(clip);
    return ndcToScreen(ndc, viewport.halfWidth, viewport.halfHeight, viewport.scale);
}
