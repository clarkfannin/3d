import { config } from "./config.js";
import parseObj from "./parsers/obj-v2.js";
import { convertCameraToScreenSpace, convertModelToCameraSpace, clipNear, lerp } from "./rendering/transformations.js";
import cull from "./rendering/culling.js";
import getBoundingBox from "./rendering/bounding-box.js";
import { pointInTriangle, interpolate, edge } from "./rendering/rasterizer.js";
import { state } from "./state.js";
import { placePixel, convertPixel } from "./canvas/drawing.js";
import setupInput, { handlePlayerActions } from "./input/input.js";
import parseMtl from "./parsers/mtl.js";
import getTextureImageData, { loadBgImage } from "./canvas/load-texture.js";

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
            const depth = interpolate(weights, canvasPoints[0].z, canvasPoints[1].z, canvasPoints[2].z);

            const tX = Math.floor(frac(u) * (mesh.textureImageData?.width - 1));
            const tY = Math.floor((1 - frac(v)) * (mesh.textureImageData?.height - 1));

            const color = convertPixel(mesh.textureImageData?.imageData, mesh.textureImageData?.width, tX, tY);
            if (
                (!state.zBuffer[y][x] || isNaN(state.zBuffer[y][x]) || depth < state.zBuffer[y][x]) &&
                // skip storing transparent pixels in the zBuffer
                color[3] !== 0
            ) {
                // if the current pixel about to be rendered is closer than another one at the same coord, update the zbuffer

                state.zBuffer[y][x] = depth;
            } else continue; // skip if it's further

            // pixel: the current x and y being iterated
            if (color) {
                placePixel(x, y, color);
            }
        }
    }
}

export function drawFaces(model, mesh) {
    for (const face of mesh.faces) {
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

        // near plane clipping
        const clipped = clipNear(cameraPoints, config.near);
        if (clipped.length < 3) continue;

        const canvasPoints = clipped.map((p) => convertCameraToScreenSpace(p, canvas));

        // walk through canvasPoints to construct triangles
        // use 0 as the 'pivot' vertex
        for (let i = 1; i < canvasPoints.length - 1; i++) {
            const tri = [canvasPoints[0], canvasPoints[i], canvasPoints[i + 1]];

            // backface culling
            if (cull(tri)) continue;

            // get bounding box to iterate over and check if pixel is in triangle
            const boundingBox = getBoundingBox(tri);

            // render pixels
            renderPixels(mesh, boundingBox, tri);
        }
    }
}

state.bgImageData = await loadBgImage(config.bgImage);

let last = performance.now();
const frame = (now) => {
    const dt = (now - last) / 1000;
    last = now;
    state.time += dt;
    handlePlayerActions(state, dt);
    ((state.zBuffer = Array.from({ length: 240 }, () => Array(320).fill(null))), state.sceneImageData.data.set(state.bgImageData.imageData.data));
    for (const model of state.models) {
        for (const mesh of model.meshes) {
            if (mesh.texture === "Green_Elka" || mesh.texture === "Green_sosna.001") {
                mesh.x = mesh.startX + Math.sin(state.time * mesh.branchOffset) / 200;
            }
            drawFaces(model, mesh);
        }
    }
    ctx.putImageData(state.sceneImageData, 0, 0);
    requestAnimationFrame(frame);
};

export async function openDB() {
    const request = indexedDB.open("models", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("models", { keyPath: "path" });
    return promisify(request);
}

const store = (db, mode) => db.transaction("models", mode).objectStore("models");

export function promisify(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.result);
    });
}

export async function getCachedModel(db, modelPath, modelText) {
    let s;
    s = store(db, "readonly");
    const getReq = s.get(modelPath);
    const getRes = await promisify(getReq);
    if (!getRes) {
        s = store(db, "readwrite");
        const modelObject = parseObj(modelText);
        await s.put({ path: modelPath, modelObject });
        return modelObject;
    }

    return getRes.modelObject;
}

const db = await openDB();
for (let model of state.models) {
    const modelRes = await fetch(model.path);
    const mtlRes = await fetch(model.materialPath);
    const modelText = await modelRes.text();
    const mtlText = await mtlRes.text();
    const modelObject = await getCachedModel(db, model.path, modelText);
    console.log(modelObject);
    Object.assign(model, modelObject);
    console.log(model)
    model.mtlMap = parseMtl(mtlText);
    for (const mesh of model.meshes) {
        mesh.startX = mesh.x;
        mesh.branchOffset = Math.random();
        mesh.textureImageData = await getTextureImageData(model, mesh);
    }
}

state.sceneImageData = ctx.getImageData(0, 0, config.width, config.height);

setupInput(state);
requestAnimationFrame(frame);

window.gs = () => {
    console.log(state)
}
