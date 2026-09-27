import { worldToCamera } from "./transformations.js";

// each p is a an array of 3 points
// reduce each to a single summed z value
export function getFaceDepth(model, mesh, camera) {
	return mesh.faces.map((face) => face.reduce((sum, f) => sum + worldToCamera(model.points[f.v - 1], camera, model).z, 0));
}

export default function sortFaces(model, mesh, camera) {
	const zSums = getFaceDepth(model, mesh, camera);
	const faceSets = mesh.faces.map((value, index) => ({ value, index }));

	mesh.screenZSum = zSums.reduce((a, b) => a + b, 0) / mesh.faces.length;
	// copy of faces where each element is now an array of its 3 points

	// painter's algorithm
	return faceSets.sort((a, b) => zSums[b.index] - zSums[a.index]).map((face) => face.value);
}
