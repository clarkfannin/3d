import { modelToWorld } from "./transformations.js";

// each p is a an array of 3 points
// reduce each to a single summed z value
export function getFaceDepth(data, model, faces) {
    return faces.map((face) => face.reduce((sum, f) => sum + modelToWorld(data.points[f.v - 1], model).z, 0));
}

export default function sortFaces(data, model, faces) {
    const zSums = getFaceDepth(data, model, faces);
    // copy of faces where each element is now an array of its 3 points
    const faceSets = faces.map((value, index) => ({ value, index }));

    // painter's algorithm
    return faceSets.sort((a, b) => zSums[b.index] - zSums[a.index]).map((face) => face.value);
}
