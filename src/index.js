import { config } from "./config.js";
import { state } from "./state.js";
import { convertCameraToScreenSpace, convertModelToCameraSpace, clipNear } from "./rendering/transformations.js";
import cull from "./rendering/culling.js";
import getBoundingBox from "./rendering/bounding-box.js";
import setupInput, { handlePlayerActions } from "./input/input.js";
import parseMtl from "./parsers/mtl.js";
import getTextureImageData, { loadBgImage } from "./canvas/load-texture.js";
import { openDB, getCachedModel } from "./indexed-db/indexed-db.js";
import { renderPixels } from "./rendering/render.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

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

export function drawFaces(model, mesh) {
    for (const face of mesh.faces) {

        const cameraPoints = getFaceCameraPoints(model, mesh, face);
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

const setup = async () => {
    canvas.width = config.width;
    canvas.height = config.height;
    canvas.style.backgroundColor = config.colors.background;

    ctx.fillStyle = config.colors.points;

    canvas.halfWidth = canvas.width / 2;
    canvas.halfHeight = canvas.height / 2;
    canvas.scale = canvas.halfHeight;
    state.bgImageData = await loadBgImage(config.bgImage);
    state.sceneImageData = ctx.getImageData(0, 0, config.width, config.height);

    for (let model of state.models) {
        const modelRes = await fetch(model.path);
        const mtlRes = await fetch(model.materialPath);
        const modelText = await modelRes.text();
        const mtlText = await mtlRes.text();
        const modelObject = await getCachedModel(db, model.path, modelText);
        console.log(modelObject);
        Object.assign(model, modelObject);
        console.log(model);
        model.mtlMap = parseMtl(mtlText);
        for (const mesh of model.meshes) {
            mesh.startX = mesh.x;
            mesh.branchOffset = Math.random();
            mesh.textureImageData = await getTextureImageData(model, mesh);
        }
    }

    setupInput(state);
};

const db = await openDB();
await setup();
requestAnimationFrame(frame);

window.gs = () => {
    console.log(state);
};
