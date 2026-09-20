const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const BACKGROUND = "black";
const POINTS = "yellow";

const MODEL = "teapot.obj";

canvas.width = 400;
canvas.height = 400;
canvas.style.backgroundColor = BACKGROUND;

ctx.fillStyle = POINTS;

const halfX = canvas.width / 2;
const halfY = canvas.height / 2;

let dt = 0;
let dz = 7;
let angle = 0;
let points;
let faces = [];

const parseObj = async (path) => {
    const res = await fetch(path);
    const text = await res.text();
    const lines = text.split("\n");
    let pointLines = [];
    let normalLines = [];
    let faceLines = [];

    lines.map((line) => {
        line = line.trim();
        if (line.startsWith("s")) {
            //start
        } else if (line.startsWith("vn")) {
            // normal vector (x y z)
            normalLines.push(line);
        } else if (line.startsWith("vt")) {
            // texture coordinate (u v)
        } else if (line.startsWith("v")) {
            // vertex (x, y, z)
            pointLines.push(line);
        } else if (line.startsWith("f")) {
            // face (v//vt//vn or v/vt/vn), 3 vertices separated by space
            faceLines.push(line);
        }
    });

    pointLines = pointLines.map((v) => {
        const result = v.split(" ").map((point) => Number(point));
        return { x: result[1], y: result[2], z: result[3] };
    });

    faceLines = faceLines.map((f) => {
        const parts = f.split(" ");
        const result = [];
        for (let i = 0; i <= 2; i++) {
            let p;
            let v;
            let vt;
            let vn;
            if (f.includes("//")) {
                p = parts[i + 1].split("//");
                vt = null,
                vn = Number(p[1]);
            } else {
                p = parts[i + 1].split("/");
                vt = Number(p[1]);
                vn = Number(p[2]);
            }
            v = Number(p[0]);
            result[i] = { v, vt, vn };
        }
        return result;
    });

    normalLines = normalLines.map((vn) => {
        const result = vn.split(" ").map((point) => Number(point));
        return { x: result[1], y: result[2], z: result[3] };
    });

    points = pointLines;

    faces = sortFaces(faceLines);
};

const translateZ = ({ x, y, z }, dz) => {
    // TODO: handle y position offset based on midpoint of coordinates in obj
    // for now i just subtract 2 from y
    return applyZ({ x: x, y: y - 2, z: z + dz });
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

const convertToCanvas = ({ x, y, z }) => {
    return {
        x: halfX + halfX * x,
        y: halfY - halfY * y,
        z,
    };
};

const renderPoints = () => {
    for (const point of points) {
        const pointSize = 10;

        const rotated = rotateXZ(point, angle);

        const translated = translateZ(rotated, dz);

        const canvasPoint = convertToCanvas(translated);

        ctx.fillRect(canvasPoint.x - pointSize / 2, canvasPoint.y - pointSize / 2, pointSize, pointSize);
    }
};

const renderFace = ([p0, p1, p2]) => {
    ctx.save();

    ctx.strokeStyle = "red";

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p0.x, p0.y);
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = "white";
    ctx.fill();

    ctx.restore();
};

const renderFaces = () => {
    for (const face of faces) {
        const canvasPoints = [];
        for (const f of face) {
            if (isNaN(f.v)) continue;
            const point = points[f.v - 1];
            const rotated = rotateXZ(point, angle);
            const translated = translateZ(rotated, dz);
            const canvasPoint = convertToCanvas(translated);
            canvasPoints.push(canvasPoint);
        }

        const p0 = canvasPoints[0];
        const p1 = canvasPoints[1];
        const p2 = canvasPoints[2];

        if (cull([p0, p1, p2])) {
            ctx.restore();
            continue;
        }

        // render
        renderFace([p0, p1, p2]);
    }
};

const sortFaces = (faces) => {
    // every frame we need to sort faces
    // faces is an array of arrays of 3 indices to the points array

    const zSums = faces.map((face) => {
        // each p is a an array of 3 points
        // reduce each to a single summed z value
        return face.reduce((sum, f) => sum + translateZ(rotateXZ(points[f.v - 1], angle), dz).z, 0);
    });

    return (
        faces
            // copy of faces where each element is now an array of its 3 points
            .map((value, index) => ({ value, index }))
            // we need to compare the summed z for each 3-point array in ps
            .sort((a, b) => zSums[b.index] - zSums[a.index])
            .map(({ value }) => value)
    );
};

const cull = (face) => {
    const a = face[0];
    const b = face[1];
    const c = face[2];

    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
};

const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faces = sortFaces(faces);
    renderFaces();
    requestAnimationFrame(frame);
    angle += 0.05;
    dt++;
};

await parseObj(MODEL);

requestAnimationFrame(frame);
