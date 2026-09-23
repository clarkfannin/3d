import { config } from "./config.js";
import parseObj from "./parsers/obj.js";
import { vertexPipeline, lerp } from "./rendering/transformations.js";
import cull from "./rendering/culling.js";
import sortFaces from "./rendering/sort-faces.js";
import getBoundingBox from "./rendering/bounding-box.js";
import { pointInTriangle, barycentric, interpolate } from "./rendering/rasterizer.js";
import { state } from "./state.js";
import { placePixel, convertPixel } from "./canvas/drawing.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

canvas.width = config.width;
canvas.height = config.height;
canvas.style.backgroundColor = config.colors.background;

ctx.fillStyle = config.colors.points;

canvas.halfWidth = canvas.width / 2;
canvas.halfHeight = canvas.height / 2;
canvas.scale = canvas.halfHeight;

export function getPixelColor([u, v]) {
    const i = (u * state.textureImageData.width + v) * 4;
    const data = state.textureImageData.imageData.data;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

export function drawFaces(model) {
    for (const face of model.faces) {
        const canvasPoints = [];

        // transform points in face to canvas space
        for (const f of face) {
            if (isNaN(f.v)) continue;
            const point = model.points[f.v - 1];
            const canvasPoint = vertexPipeline(point, model, state.camera, canvas);

            if (canvasPoint) {
                canvasPoint.u = model.uvs[f.vt - 1].u;
                canvasPoint.v = model.uvs[f.vt - 1].v;
            }

            canvasPoints.push(canvasPoint);
        }

        // backface culling
        if (canvasPoints.some((v) => v === null)) continue;
        if (cull(canvasPoints)) continue;

        // get bounding box to iterate over and check if pixel is in triangle
        const boundingBox = getBoundingBox(canvasPoints);

        // render pixels
        for (let x = boundingBox.xMin; x < boundingBox.xMax; x++) {
            for (let y = boundingBox.yMin; y < boundingBox.yMax; y++) {
                const weights = barycentric({ x, y }, canvasPoints[0], canvasPoints[1], canvasPoints[2]);
                const u = interpolate(weights, canvasPoints[0].u, canvasPoints[1].u, canvasPoints[2].u);
                const v = interpolate(weights, canvasPoints[0].v, canvasPoints[1].v, canvasPoints[2].v);

                const tX = Math.floor(u * (model.textureImageData.width - 1));
                const tY = Math.floor((1 - v) * (model.textureImageData.height - 1));

                const color = convertPixel(model.textureImageData.imageData, model.textureImageData.width, tX, tY);

                // pixel: the current x and y being iterated
                if (pointInTriangle(x, y, canvasPoints)) {
                    placePixel(x, y, color);
                }
            }
        }
    }
}

const frame = () => {
    state.sceneImageData.data.fill(0);
    for (let i = 0; i < state.models.length; i++) {
        state.models[i].faces = sortFaces(state.models[i]);
        drawFaces(state.models[i]);
    }
    ctx.putImageData(state.sceneImageData, 0, 0);
    requestAnimationFrame(frame);

    state.sceneImageData = ctx.getImageData(0, 0, config.width, config.height);
};

for (const model of state.models) {
    const res = await fetch(model.path);
    Object.assign(model, parseObj(await res.text()));
}
state.sceneImageData = ctx.getImageData(0, 0, config.width, config.height);

requestAnimationFrame(frame);
