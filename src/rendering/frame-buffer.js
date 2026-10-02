import { config } from "../config.js";

class FrameBuffer {
	constructor() {
        this.bgImageData = null;
		this.imageData = null;
		this.zBuf = Array.from({ length: config.height }, () => Array(config.width).fill(null));
	}

	clear() {
		this.zBuf = Array.from({ length: config.height }, () => Array(config.width).fill(null));
		this.imageData.data.set(this.bgImageData.data);
	}
}

export const frameBuffer = new FrameBuffer();
