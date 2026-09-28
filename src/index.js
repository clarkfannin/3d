import { config } from "./config.js";
import parseObj from "./parsers/obj-v2.js";
import { vertexPipeline, lerp } from "./rendering/transformations.js";
import cull from "./rendering/culling.js";
import sortFaces from "./rendering/sort-faces.js";
import getBoundingBox from "./rendering/bounding-box.js";
import { pointInTriangle, barycentric, interpolate, edge } from "./rendering/rasterizer.js";
import { state } from "./state.js";
import { placePixel, convertPixel } from "./canvas/drawing.js";
import setupInput, { handlePlayerActions } from "./input/input.js";
import parseMtl from "./parsers/mtl.js";
import getTextureImageData from "./canvas/load-texture.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

canvas.width = config.width;
canvas.height = config.height;
canvas.style.backgroundColor = config.colors.background;

ctx.fillStyle = config.colors.points;

canvas.halfWidth = canvas.width / 2;
canvas.halfHeight = canvas.height / 2;
canvas.scale = canvas.halfHeight;

const frac = (x) => x - Math.floor(x);

export function renderPixels(mesh, boundingBox, canvasPoints) {
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

            const tX = Math.floor(frac(u) * (mesh.textureImageData?.width - 1));
            const tY = Math.floor((1 - frac(v)) * (mesh.textureImageData?.height - 1));

            const color = convertPixel(mesh.textureImageData?.imageData, mesh.textureImageData?.width, tX, tY);

            // pixel: the current x and y being iterated
            if (color) {
                placePixel(x, y, color);
            }
        }
    }
}

export function drawFaces(model, mesh) {
    for (const face of mesh.faces) {
        const canvasPoints = [];

        // transform points in face to canvas space
        for (const f of face) {
            // v = vertices index from obj
            if (isNaN(f.v)) continue;
            const point = model.points[f.v - 1];
            const canvasPoint = vertexPipeline(point, model, mesh, state.camera, canvas);

            if (canvasPoint) {
                canvasPoint.u = model.uvs[f.vt - 1]?.u;
                canvasPoint.v = model.uvs[f.vt - 1]?.v;
            }

            canvasPoints.push(canvasPoint);
        }

        // backface culling
        if (canvasPoints.some((v) => v === null)) continue;
        if (cull(canvasPoints)) continue;

        // get bounding box to iterate over and check if pixel is in triangle
        const boundingBox = getBoundingBox(canvasPoints);

        // render pixels
        renderPixels(mesh, boundingBox, canvasPoints);
    }
}

export function sortModels(models) {
    return models.flat().sort((a, b) => b.screenZSum - a.screenZSum);
}

export function sortMeshes(model) {
    model.meshes = model.meshes.flat().sort((a, b) => {
        if (a.texture === "Floor") return -1;
        if (b.texture === "Floor") return 1;
        return b.screenZSum - a.screenZSum;
    });
}

let last = performance.now();
const frame = (now) => {
    const dt = (now - last) / 1000;
    last = now;
    state.time++;
    handlePlayerActions(state, dt);
    state.sceneImageData.data.fill(0);
    state.models = sortModels(state.models);
    for (const model of state.models) {
        model.screenZSum = 0;
        sortMeshes(model);
        for (const mesh of model.meshes) {
            mesh.screenZSum = 0;
            mesh.faces = sortFaces(model, mesh, state.camera);
            
            if (mesh.texture === "Green_Elka") {
                mesh.x = mesh.startX + Math.sin(state.time * mesh.branchOffset) / 200;
            }
            drawFaces(model, mesh);
        }
    }
    ctx.putImageData(state.sceneImageData, 0, 0);
    requestAnimationFrame(frame);

    state.sceneImageData = ctx.getImageData(0, 0, config.width, config.height);
};

for (let model of state.models) {
    model.screenZSum = 0;
    const modelRes = await fetch(model.path);
    const mtlRes = await fetch(model.materialPath);
    Object.assign(model, parseObj(await modelRes.text()));
    model.mtlMap = parseMtl(await mtlRes.text());
    for (const mesh of model.meshes) {
        mesh.screenZSum = 0;
        mesh.startX = mesh.x;
        mesh.branchOffset = Math.random()/5
        mesh.textureImageData = await getTextureImageData(model, mesh);
    }
}

state.sceneImageData = ctx.getImageData(0, 0, config.width, config.height);

setupInput(state);
requestAnimationFrame(frame);
