const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const BACKGROUND = "black";
const POINTS = "yellow";

const MODEL = "tree.obj";

canvas.width = 400;
canvas.height = 400;
canvas.style.backgroundColor = BACKGROUND;

ctx.fillStyle = POINTS;

const halfX = canvas.width / 2;
const halfY = canvas.height / 2;

let dt = 0;
let dz = 3;
let angle = 0;
let points;
let faces;

const parseObj = async (path) => {
	const res = await fetch(path);
	const text = await res.text();
	const lines = text.split("\n");
	let v = [];
	const vn = [];
	let f = [];

	lines.map((line) => {
		line = line.trim();
		if (line.startsWith("s")) {
			//start
		} else if (line.startsWith("vn")) {
			// normals
		} else if (line.startsWith("v")) {
			v.push(line);
		} else if (line.startsWith("f")) {
			f.push(line);
		}
	});

	v = v.map((point) => {
		const parts = point.split(" ").map((p) => Number(p));
		return { x: parts[1], y: parts[2], z: parts[3] };
	});

	f = f.map((face) => {
		const parts = face.split(" ");
		const result = [];
		for (let i = 0; i <= 2; i++) {
			let p;
			if (face.includes("//")) {
				p = parts[i + 1].split("//");
			} else {
				p = parts[i + 1].split("/");
			}
			// take the vertex
			result[i] = Number(p[0]);
		}
		return result;
	});

	points = v;
	faces = sortFaces(f);
};

const translateZ = ({ x, y, z }, dz) => {
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
		for (const index of face) {
			if (isNaN(index)) continue;
			const point = points[index - 1];
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
	return faces
		.map((face) => {
			face
				.map((f) => points[f].z)
				.reduce((acc, curr) => {
					return (acc + curr) / 3;
				}, 0);
		})
		.sort((a, b) => a - b);
};

const cull = (face) => {
	const a = face[0];
	const b = face[1];
	const c = face[2];

	return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
};

const frame = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	renderFaces();
	requestAnimationFrame(frame);
	angle += 0.05;
	dt++;
};

await parseObj(MODEL);

requestAnimationFrame(frame);
