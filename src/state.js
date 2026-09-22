import getTextureImageData from "./canvas/load-texture.js"
import { config } from "./config.js"

export const state = {
    sceneImageData: null,
    textureImageData: await getTextureImageData(config.texture),
    model: {x: 0, y: 0, z: .8, yaw: 0, pitch: 0, roll: 0},
    camera: {x: 0, y: 0, z: -.8, yaw: 0, pitch: 0, roll: 0}
}