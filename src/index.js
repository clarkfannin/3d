import parseObj from "./parsers/obj.js";
import { translateZ, rotateXZ, convertToCanvas } from "./transformations.js";
import cull from "./culling.js";
import renderFace from "./rendering/render-face.js";
import quicksortFaces from "./rendering/quicksort-faces.js"
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

let points = [];
let faces = []

const config = {dt: 0, dz: 7, angle: 0}

export function sortFaces(faces) {
    const zSums = faces.map((face) => {
        // each p is a an array of 3 points
        // reduce each to a single summed z value
        return face.reduce((sum, f) => sum + translateZ(rotateXZ(points[f.v - 1], config.angle), config.dz).z, 0);
    });

    // copy of faces where each element is now an array of its 3 points
    const faceSets = faces.map((value, index) => ({ value, index }));

    // painter's algorithm
    return faceSets.sort((a, b) => zSums[b.index] - zSums[a.index]).map((face) => face.value);
}

export function drawFaces() {
    for (const face of faces) {
        const rawPoints = [];
        const canvasPoints = [];
        for (const f of face) {
            if (isNaN(f.v)) continue;
            const point = points[f.v - 1];
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

        // render
        renderFace(ctx, canvasPoints);
    }
}

const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faces = sortFaces(faces);
    drawFaces();
    requestAnimationFrame(frame);
    config.angle += 0.05;
    config.dt++;
};

const res = await fetch(MODEL);
({ points, faces } = parseObj(await res.text()));

requestAnimationFrame(frame);
