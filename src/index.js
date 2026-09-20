import { config } from "./config.js";
import parseObj from "./parsers/obj.js";
import { translateZ, rotateXZ, convertToCanvas } from "./transformations.js";
import cull from "./rendering/culling.js";
import sortFaces from "./rendering/sort-faces.js";
import renderFace from "./canvas/draw-face.js";
import getBoundingBox from "./rendering/bounding-box.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const BACKGROUND = "black";
const POINTS = "yellow";

const MODEL = "models/teapot.obj";

canvas.width = 400;
canvas.height = 400;
canvas.style.backgroundColor = BACKGROUND;

ctx.fillStyle = POINTS;

const halfX = canvas.width / 2;
const halfY = canvas.height / 2;

const data = {points: [], faces: []}

export function drawFaces() {
    for (const face of data.faces) {
        const rawPoints = [];
        const canvasPoints = [];
        for (const f of face) {
            if (isNaN(f.v)) continue;
            const point = data.points[f.v - 1];
            const rotated = rotateXZ(point, config.angle);
            const translated = translateZ(rotated, config.dz);
            const canvasPoint = convertToCanvas(translated, halfX, halfY);
            rawPoints.push(point);
            canvasPoints.push(canvasPoint);
        }

        const boundingBox = getBoundingBox(rawPoints);

        if (cull(canvasPoints)) {
            ctx.restore();
            continue;
        }

        renderFace(ctx, canvasPoints);
    }
}

const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    data.faces = sortFaces(data, config, data.faces);
    drawFaces();
    requestAnimationFrame(frame);
    config.angle += 0.05;
    config.dt++;
};

const res = await fetch(MODEL);
({ points: data.points, faces: data.faces } = parseObj(await res.text()));

requestAnimationFrame(frame);
