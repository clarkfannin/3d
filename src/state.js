import getTextureImageData from "./canvas/load-texture.js";

export const state = {
    sceneImageData: null,
    keys: new Set(),
    models: [
        {
            path: "models/forest.obj",
            materialPath: "models/forest.mtl",
            x: 0,
            y: 0,
            z: 0,
            yaw: 0,
            pitch: 0,
            roll: 0,
            scale: .5,
            points: [],
            uvs: [],
            meshes: [],
            screenZSum: 0,
        },
    ],
    camera: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, forward: 0, right: 0, up: 0 },
};
