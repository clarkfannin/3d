import { modelToWorld, worldToCamera } from "./transformations.js";

// each p is a an array of 3 points
// reduce each to a single summed z value
export function getFaceDepth(model, mesh, camera) {
    return mesh.faces.map((face) => {
        return face.reduce((sum, f) => {
            const world = modelToWorld(model.points[f.v - 1], model, mesh)
            const view = worldToCamera(world, camera, model);
            return (sum + view.z);
        }, 0);
    });
}

export default function sortFaces(model, mesh, camera) {
    const zSums = getFaceDepth(model, mesh, camera);
    const faceSets = mesh.faces.map((value, index) => ({ value, index }));

    mesh.screenZSum = zSums.reduce((a, b) => a + b, 0) / mesh.faces.length;
    model.screenZSum += mesh.screenZSum;
    // copy of faces where each element is now an array of its 3 points

    // painter's algorithm
    return faceSets.sort((a, b) => zSums[b.index] - zSums[a.index]).map((face) => face.value);
}
