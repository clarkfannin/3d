const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const BACKGROUND = "black";
const POINTS = "yellow";

const points = [
    // front face
    { x: -0.25, y: -0.25, z: 0.25 },
    { x: 0.25, y: -0.25, z: 0.25 },
    { x: 0.25, y: 0.25, z: 0.25 },
    { x: -0.25, y: 0.25, z: 0.25 },
    // back face
    { x: -0.25, y: -0.25, z: -0.25 },
    { x: 0.25, y: -0.25, z: -0.25 },
    { x: 0.25, y: 0.25, z: -0.25 },
    { x: -0.25, y: 0.25, z: -0.25 },
];

const wires = [
    //front face
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],

    // sides
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],

    // back face
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
];

const triangles = [
    // front
    [0, 1, 3],
    [1, 2, 3],

    // left
    [4, 0, 7],
    [0, 3, 7],

    // right
    [1, 5, 2],
    [5, 6, 2],

    // back
    [5, 4, 6],
    [4, 7, 6],

    // up
    [3, 2, 7],
    [2, 6, 7],

    // down
    [4, 5, 0],
    [5, 1, 0],
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
    return applyZ({ x: x, y: y, z: z + dz });
};

const applyZ = ({ x, y, z }) => {
    return { x: x / z, y: y / z, z: z };
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

        const canvasPoint = convertToCanvas(zTranslatedPoint);

        ctx.fillRect(canvasPoint.x - pointSize / 2, canvasPoint.y - pointSize / 2, pointSize, pointSize);
    }
};

const drawWires = () => {
    for (const wire of wires) {
        const startIndex = wire[0]; // 0-8
        const endIndex = wire[1]; // 0-8

        // get the points at those^ indices
        const startPoint = points[startIndex];
        const endPoint = points[endIndex];

        // first transform them
        const rotatedStartPoint = rotateXZ(startPoint, angle);
        const rotatedEndPoint = rotateXZ(endPoint, angle);

        const translatedStartPoint = translateZ(rotatedStartPoint, dz);
        const translatedEndPoint = translateZ(rotatedEndPoint, dz);

        const canvasStartPoint = convertToCanvas(translatedStartPoint);
        const canvasEndPoint = convertToCanvas(translatedEndPoint);

        // then get x and y from them
        const startX = canvasStartPoint.x;
        const startY = canvasStartPoint.y;
        const endX = canvasEndPoint.x;
        const endY = canvasEndPoint.y;

        // render
        ctx.save();

        ctx.strokeStyle = "white";
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();
    }
};

const drawFaces = () => {
    for (const tri of triangles) {
        const canvasPoints = [];
        for (const index of tri) {
            const point = points[index];
            const rotated = rotateXZ(point, angle);
            const translated = translateZ(rotated, dz);
            const canvasPoint = convertToCanvas(translated);
            canvasPoints.push(canvasPoint);
        }

        const p0 = canvasPoints[0];
        const p1 = canvasPoints[1];
        const p2 = canvasPoints[2];

        // render
        ctx.save();

        ctx.strokeStyle = "blue";
        ctx.lineWidth = 5;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p0.x, p0.y);
        ctx.closePath();

        if (cull([p0, p1, p2])) continue;
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.restore();
    }
};

const cull = (face) => {
    const a = face[0];
    const b = face[1];
    const c = face[2];

    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
};

const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFaces();
    requestAnimationFrame(frame);
    angle += 0.1;
    dt++;
};

requestAnimationFrame(frame);
