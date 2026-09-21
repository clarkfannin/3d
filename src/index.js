import { config } from "./config.js";
import parseObj from "./parsers/obj.js";
import { translateZ, rotateXZ, convertToCanvas } from "./rendering/transformations.js";
import cull from "./rendering/culling.js";
import sortFaces from "./rendering/sort-faces.js";
import getBoundingBox from "./rendering/bounding-box.js";
import { pointInTriangle, barycentric, interpolate } from "./rendering/rasterizer.js";
import { convertPixel } from "./canvas/drawing.js";
import getTextureImageData from "./canvas/load-texture.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const MODEL = "models/rat.obj";
const TEXTURE = "models/rat.png";

canvas.width = config.width;
canvas.height = config.height;
canvas.style.backgroundColor = config.colors.background;

ctx.fillStyle = config.colors.points;

const halfCanvasWidth = canvas.width / 2;
const halfCanvasHeight = canvas.height / 2;
const scale = halfCanvasHeight;

const data = { points: [], faces: [], uvs: [] };

let sceneImageData;
const textureImageData = await getTextureImageData(TEXTURE);

export function getPixelColor([u, v]) {
    const i = (u * textureImageData.width + v) * 4;
    const data = textureImageData.imageData.data;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

export function placePixel(x, y, [r, g, b, a]) {
    // index in the global pixel buffer, [r, g, b, a, r, g, b, a...]
    const index = (y * config.width + x) * 4;
    sceneImageData.data[index] = r;
    sceneImageData.data[index + 1] = g;
    sceneImageData.data[index + 2] = b;
    sceneImageData.data[index + 3] = a;
}

export function drawFaces() {
    for (const face of data.faces) {
        const canvasPoints = [];

        // transform points in face to canvas space
        for (const f of face) {
            if (isNaN(f.v)) continue;
            const point = data.points[f.v - 1];
            const rotated = rotateXZ(point, config.angle);
            const translated = translateZ(rotated, config.dz);
            const canvasPoint = convertToCanvas(translated, halfCanvasWidth, halfCanvasHeight, scale);

            canvasPoint.u = data.uvs[f.vt - 1].u;
            canvasPoint.v = data.uvs[f.vt - 1].v;

            canvasPoints.push(canvasPoint);
        }

        // backface culling
        if (cull(canvasPoints)) {
            ctx.restore();
            continue;
        }

        // get bounding box to iterate over and check if pixel is in triangle
        const boundingBox = getBoundingBox(canvasPoints);

        // render pixels
        for (let x = boundingBox.xMin; x < boundingBox.xMax; x++) {
            for (let y = boundingBox.yMin; y < boundingBox.yMax; y++) {
                const weights = barycentric({ x, y }, canvasPoints[0], canvasPoints[1], canvasPoints[2]);
                const u = interpolate(weights, canvasPoints[0].u, canvasPoints[1].u, canvasPoints[2].u);
                const v = interpolate(weights, canvasPoints[0].v, canvasPoints[1].v, canvasPoints[2].v);

                const tX = Math.floor(u * (textureImageData.width - 1));
                const tY = Math.floor((1 - v) * (textureImageData.height - 1));

                const color = convertPixel(textureImageData.imageData, textureImageData.width, tX, tY);

                // pixel: the current x and y being iterated
                if (pointInTriangle(x, y, canvasPoints)) {
                    placePixel(x, y, color);
                }
            }
        }
    }
}

const frame = () => {
    sceneImageData.data.fill(0);
    data.faces = sortFaces(data, config, data.faces);
    drawFaces();
    ctx.putImageData(sceneImageData, 0, 0);
    requestAnimationFrame(frame);
    config.angle += 0.05;
    config.dt++;
    sceneImageData = ctx.getImageData(0, 0, config.width, config.height);
};

const res = await fetch(MODEL);
({ points: data.points, faces: data.faces, uvs: data.uvs } = parseObj(await res.text()));
sceneImageData = ctx.getImageData(0, 0, config.width, config.height);

requestAnimationFrame(frame);
