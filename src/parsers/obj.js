import { config } from "../config.js";
import { convertToCanvas } from "../rendering/transformations.js";

export default function parseObj(text) {
	const lines = text.split("\n");
	let pointLines = [];
	let normalLines = [];
	let textureLines = [];
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
			textureLines.push(line);
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
				((vt = null), (vn = Number(p[1])));
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
		const result = vn.split(" ");
		return { x: Number(result[1]), y: Number(result[2]), z: Number(result[3]) };
	});

	textureLines = textureLines.map((vt) => {
		const result = vt.split(" ");
		return { u: Number(result[1]), v: Number(result[2]) };
	});

	const points = pointLines;
	const faces = faceLines;
	const uvs = textureLines;
	const yVals = points.map((p) => {
		const canvasPoint = convertToCanvas(p, config.width / 2, config.height / 2, config.height / 2);
        return canvasPoint.y;
	});
	const yMin = Math.min(...yVals);
	const yMax = Math.max(...yVals);
	const height = yMax - yMin;

	return { points, faces, uvs, height };
}
