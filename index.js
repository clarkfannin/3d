const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const BACKGROUND = "black";
const POINTS = "yellow";

const points = [
    // front face
    { x: -0.25, y: -0.25, z: 0.25 },
    { x: 0.25, y: -0.25, z: 0.25 },
    { x: -0.25, y: 0.25, z: 0.25 },
    { x: 0.25, y: 0.25, z: 0.25 },
    // back face
    { x: -0.25, y: -0.25, z: -0.25 },
    { x: -0.25, y: 0.25, z: -0.25 },
    { x: 0.25, y: -0.25, z: -0.25 },
    { x: 0.25, y: 0.25, z: -0.25 },
];

canvas.width = 400;
canvas.height = 400;
canvas.style.backgroundColor = BACKGROUND;

ctx.fillStyle = POINTS;

const halfX = canvas.width / 2;
const halfY = canvas.height / 2;

let dt = 0;
let dz = 1;
let angle = 0;

const translateZ = ({ x, y, z }, dz) => {
    return { x: x, y: y, z: z + dz };
};

const rotateXZ = ({ x, y, z }, angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x: x * c - z * s,
        y,
        z: x * s + z * c,
    };
};

const convertToCanvas = (point) => {
    const result = { ...point };

    if (result.x > 0) {
        result.x = halfX + halfX * result.x; // 200 + 200 * .5 = 300
    } else if (result.x < 0) {
        result.x = halfX - halfX * Math.abs(result.x); // 200 - 200 * .5 = 100
    } else {
        result.x = halfX;
    }

    if (result.y > 0) {
        result.y = halfY + halfY * result.y;
    } else if (result.y < 0) {
        result.y = halfY - halfY * Math.abs(result.y);
    } else {
        result.y = halfY;
    }

    return result;
};

const drawPoints = () => {
    for (const point of points) {
        const pointSize = 10;

        const rotatedPoint = rotateXZ(point, angle);

        const zTranslatedPoint = translateZ(rotatedPoint, dz);
        zTranslatedPoint.x = zTranslatedPoint.x / zTranslatedPoint.z;
        zTranslatedPoint.y = zTranslatedPoint.y / zTranslatedPoint.z;

        const canvasPoint = convertToCanvas(zTranslatedPoint);

        ctx.fillRect(canvasPoint.x - pointSize / 2, canvasPoint.y - pointSize / 2, pointSize, pointSize);
    }
};

const distanceBetween = (pointA, pointB) => {
    const result = Math.sqrt(Math.abs(Math.pow(pointB.x - pointA.x, 2)) + Math.abs(Math.pow(pointB.y - pointA.y, 2)));
    return result;
};

const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoints();
    requestAnimationFrame(frame);
    angle += 0.1;
    dt++;
};

requestAnimationFrame(frame);
