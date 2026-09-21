export default async function getTextureImageData(texturePath) {
    const img = new Image();
    img.src = texturePath;
    await img.decode();
    const shadowCanvas = document.createElement("canvas");
    const shadowCtx = shadowCanvas.getContext("2d");
    shadowCanvas.width = img.naturalWidth;
    shadowCanvas.height = img.naturalHeight;

    shadowCtx.drawImage(img, 0, 0);
    return { imageData: shadowCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight), width: img.naturalWidth, height: img.naturalHeight };
}