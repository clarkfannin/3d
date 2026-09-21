import { config } from "./config.js";
import parseObj from "./parsers/obj.js";
import { translateZ, rotateXZ, convertToCanvas } from "./rendering/transformations.js";
import cull from "./rendering/culling.js";
import sortFaces from "./rendering/sort-faces.js";
import getBoundingBox from "./rendering/bounding-box.js";
import { pointInTriangle } from "./rendering/rasterizer.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const MODEL = "models/tree.obj";
const TEXTURE = "models/texture_tree.png";

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

export async function getTextureImageData(texturePath) {
    const img = new Image();
    img.src = texturePath;
    await img.decode();
    const shadowCanvas = document.createElement("canvas");
    const shadowCtx = shadowCanvas.getContext("2d");
    shadowCanvas.width = img.naturalWidth;
    shadowCanvas.height = img.naturalHeight;

    shadowCtx.drawImage(img, 0, 0);
    return { imageData: shadowCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight), width: img.naturalWidth, height: img.naturalHeight };
}

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
                const dist = (v0, v1) => {
                    return Math.sqrt(Math.pow(v1.x - v0.x, 2) + Math.pow(v1.y - v0.y, 2));
                };

                const area = (s, edge0, edge1, edge2) => {
                    return Math.sqrt(s * (s - edge0) * (s - edge1) * (s - edge2));
                };

                const barycentric = (point, v0, v1, v2) => {
                    //outer edges
                    const edgeOuter0 = dist(v0, v1);
                    const edgeOuter1 = dist(v1, v2);
                    const edgeOuter2 = dist(v2, v0);
                    //inner edges
                    const edgeInner0 = dist(point, v0);
                    const edgeInner1 = dist(point, v1);
                    const edgeInner2 = dist(point, v2);

                    const sOuter = (edgeOuter0 + edgeOuter1 + edgeOuter2) / 2;
                    const sInner0 = (edgeOuter0 + edgeInner0 + edgeInner1) / 2;
                    const sInner1 = (edgeOuter1 + edgeInner1 + edgeInner2) / 2;
                    const sInner2 = (edgeOuter2 + edgeInner2 + edgeInner0) / 2;

                    const areaOuter = area(sOuter, edgeOuter0, edgeOuter1, edgeOuter2);
                    const areaInner0 = area(sInner0, edgeOuter0, edgeInner0, edgeInner1);
                    const areaInner1 = area(sInner1, edgeOuter1, edgeInner1, edgeInner2);
                    const areaInner2 = area(sInner2, edgeOuter2, edgeInner2, edgeInner0);

                    // each weight is the area of the sub-triangle opposite its vertex
                    const w0 = areaInner1 / areaOuter;
                    const w1 = areaInner2 / areaOuter;
                    const w2 = areaInner0 / areaOuter;

                    return {
                        w0,
                        w1,
                        w2,
                    };
                };

                const interpolate = ({w0, w1, w2}, a0, a1, a2) => {
                    return w0 * a0 + w1 * a1 + w2 * a2;
                };

                const weights = barycentric({ x, y }, canvasPoints[0], canvasPoints[1], canvasPoints[2]);
                const u = interpolate(weights, canvasPoints[0].u, canvasPoints[1].u, canvasPoints[2].u);
                const v = interpolate(weights, canvasPoints[0].v, canvasPoints[1].v, canvasPoints[2].v);

                const tX = Math.floor(u * textureImageData.width - 1);
                const tY = Math.floor((1 - v) * (textureImageData.height - 1));

                const tIndex = (tY * textureImageData.width + tX) * 4;
                const r = textureImageData.imageData.data[tIndex];
                const g = textureImageData.imageData.data[tIndex + 1];
                const b = textureImageData.imageData.data[tIndex + 2];
                const a = textureImageData.imageData.data[tIndex + 3];

                const color = [r, g, b, a];
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
