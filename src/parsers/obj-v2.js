export default function parseObj(text) {
	const meshes = [];
	const points = [];
	const uvs = [];
	const objects = text.split(/^o /m);
	for (let i = 0; i < objects.length; i++) {
		const lines = objects[i].split("\n");
		let pointLines = [];
		let normalLines = [];
		let uvLines = [];
		let faceLines = [];
		let texture;

		lines.map((line) => {
			line = line.trim();
			if (line.startsWith("s")) {
				//start
			} else if (line.startsWith("vn")) {
				// normal vector (x y z)
				normalLines.push(line);
			} else if (line.startsWith("vt")) {
				// texture coordinate (u v)
				uvLines.push(line);
			} else if (line.startsWith("v")) {
				// vertex (x, y, z)
				pointLines.push(line);
			} else if (line.startsWith("f")) {
				// face (v//vt//vn or v/vt/vn), 3 vertices separated by space
				faceLines.push(line);
			} else if (line.startsWith("usemtl")) {
				texture = `${line.split(" ")[1]}`;
			}
		});

		// convert each element in pointlines to a point
		pointLines = pointLines.map((v) => {
			const result = v.split(" ").map((point) => Number(point));
			return { x: result[1], y: result[2], z: result[3] };
		});

		faceLines = faceLines.flatMap((f) => {
			const parts = f.split(" ");
			const vertices = parseFaceLine(f, parts);
			// naively handle 4-gons
			if (vertices.length > 3) {
				return [[vertices[0], vertices[1], vertices[3]], [vertices[1], vertices[2], vertices[3]]]
			}
			return [vertices];
		});

		normalLines = normalLines.map((vn) => {
			const result = vn.split(" ");
			return { x: Number(result[1]), y: Number(result[2]), z: Number(result[3]) };
		});

		uvLines = uvLines.map((vt) => {
			const result = vt.split(" ");
			return { u: Number(result[1]), v: Number(result[2]) };
		});

		points.push(...pointLines);
		uvs.push(...uvLines);

		const faces = faceLines;
		if (faces.length === 0) continue;
		meshes.push({ faces, texture });
	}

	const yVals = points.map((p) => {
		return p.y;
	});

	const yMin = Math.min(...yVals);
	const yMax = Math.max(...yVals);
	const yCenter = (yMax + yMin) / 2;
	for (const p of points) {
		p.y -= yCenter;
		p.z = -p.z
	}

	return { points, uvs, meshes };
}

export function parseFaceLine(f, parts) {
	const result = [];
	for (let i = 0; i < parts.length - 1; i++) {
		let p;
		let v;
		let vt;
		let vn;
		if (f.includes("//")) {
			p = parts[i + 1].split("//");
			vt = null;
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
}
