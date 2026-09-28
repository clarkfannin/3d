import { config } from "../config.js";
export default async function getTextureImageData(model, mesh) {
    if (!model.mtlMap[mesh.texture]) return;
    const img = new Image();
    img.src = `models/${model.mtlMap[mesh.texture]}`;
    await img.decode();
    const shadowCanvas = document.createElement("canvas");
    const shadowCtx = shadowCanvas.getContext("2d");
    shadowCanvas.width = img.naturalWidth;
    shadowCanvas.height = img.naturalHeight;

    shadowCtx.drawImage(img, 0, 0);
    return { imageData: shadowCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight), width: img.naturalWidth, height: img.naturalHeight };
}

export async function loadBgImage(path) {
    const img = new Image();
    img.width = config.width;
    img.height = config.height;
    img.src = path;
    await img.decode();
    const shadowCanvas = document.createElement("canvas");
    const shadowCtx = shadowCanvas.getContext("2d");
    shadowCanvas.width = img.width;
    shadowCanvas.height = img.height;
    shadowCtx.drawImage(img, 0, 0);
    return { imageData: shadowCtx.getImageData(0, 0, img.width, img.height), width: img.width, height: img.height };
}
