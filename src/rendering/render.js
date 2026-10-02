import { state } from "../state.js";
import { frac } from "../math/math.js";
import { placePixel, convertPixel } from "../canvas/drawing.js";
import { pointInTriangle, interpolate, edge } from "./rasterizer.js";
import { convertModelToCameraSpace } from "./transformations.js";
import { frameBuffer } from "./frame-buffer.js";

export function getFaceCameraPoints(model, mesh, face) {
    const cameraPoints = [];

    // transform points in face to camera space
    for (const f of face) {
        // v = vertices index from obj
        if (isNaN(f.v)) continue;
        const point = model.points[f.v - 1];
        point.u = model.uvs[f.vt - 1]?.u;
        point.v = model.uvs[f.vt - 1]?.v;
        const cameraPoint = convertModelToCameraSpace(point, model, mesh, state.camera);
        cameraPoints.push(cameraPoint);
    }

    return cameraPoints;
}

export function renderPixels(mesh, boundingBox, canvasPoints, offset) {
    for (let x = boundingBox.xMin; x < boundingBox.xMax; x++) {
        for (let y = boundingBox.yMin; y < boundingBox.yMax; y++) {
            const p = { x, y };
            const e0 = edge(p, canvasPoints[1], canvasPoints[2]);
            const e1 = edge(p, canvasPoints[2], canvasPoints[0]);
            const e2 = edge(p, canvasPoints[0], canvasPoints[1]);
            if (!pointInTriangle(e0, e1, e2)) continue;

            const sum = e0 + e1 + e2;

            const weights = { w0: e0 / sum, w1: e1 / sum, w2: e2 / sum };
            const u = interpolate(weights, canvasPoints[0].u, canvasPoints[1].u, canvasPoints[2].u);
            const v = interpolate(weights, canvasPoints[0].v, canvasPoints[1].v, canvasPoints[2].v);
            const depth = interpolate(weights, canvasPoints[0].z, canvasPoints[1].z, canvasPoints[2].z);

            const tX = Math.floor(frac(u) * (mesh.textureImageData?.width - 1));
            const tY = Math.floor((1 - frac(v)) * (mesh.textureImageData?.height - 1));

            let color = convertPixel(mesh.textureImageData?.imageData, mesh.textureImageData?.width, tX, tY);
            // super basic distance-based shading
            color = color.map((c) => {
                return c > 0 ? c - depth * 20 : c;
            })
            if (
                (!frameBuffer.zBuf[y][x] || isNaN(frameBuffer.zBuf[y][x]) || depth < frameBuffer.zBuf[y][x]) &&
                // skip storing transparent pixels in the zBuf
                color[3] !== 0
            ) {
                // if the current pixel about to be rendered is closer than another one at the same coord, update the zBuf
                frameBuffer.zBuf[y][x] = depth;
            } else continue; // skip if it's further

            // pixel: the current x and y being iterated
            if (color) {
                placePixel(x, y, color);
            }
        }
    }
}