import getTextureImageData from "./canvas/load-texture.js"
import { config } from "./config.js"

export const state = {
    sceneImageData: null,
    textureImageData: await getTextureImageData(config.texture),
}