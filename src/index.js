import { config } from "./config.js";
import parseObj from "./parsers/obj.js";
import { translateZ, rotateXZ, convertToCanvas } from "./rendering/transformations.js";
import cull from "./rendering/culling.js";
import sortFaces from "./rendering/sort-faces.js";
import getBoundingBox from "./rendering/bounding-box.js";
import { pointInTriangle } from "./rendering/rasterizer.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const MODEL = "models/teapot.obj";

canvas.width = config.width;
canvas.height = config.height;
canvas.style.backgroundColor = config.colors.background;

ctx.fillStyle = config.colors.points;

const halfCanvasWidth = canvas.width / 2;
const halfCanvasHeight = canvas.height / 2;
const scale = halfCanvasHeight;

const data = { points: [], faces: [] };

let imageData;

export function placePixel(x, y) {
    // index in the global pixel buffer, [r, g, b, a, r, g, b, a...]
    const index = (y * config.width + x) * 4;
    imageData.data[index] = 255;
    imageData.data[index + 1] = 255;
    imageData.data[index + 2] = 255;
    imageData.data[index + 3] = 255;
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
                // pixel: the current x and y being iterated
                if (pointInTriangle([x, y], canvasPoints)) {
                    placePixel(x, y);
                }
            }
        }
    }
}

const frame = () => {
    imageData.data.fill(0);
    data.faces = sortFaces(data, config, data.faces);
    drawFaces();
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(frame);
    config.angle += 0.05;
    config.dt++;
    imageData = ctx.getImageData(0, 0, config.width, config.height);
};

const res = await fetch(MODEL);
({ points: data.points, faces: data.faces } = parseObj(await res.text()));
imageData = ctx.getImageData(0, 0, config.width, config.height)

requestAnimationFrame(frame);
