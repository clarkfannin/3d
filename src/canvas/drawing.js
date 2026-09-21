import { config } from "../config.js";
import getBoundingBox from "../rendering/bounding-box.js";

export function drawFace(ctx, [p0, p1, p2]) {
    ctx.save();

    ctx.strokeStyle = config.colors.lines;

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p0.x, p0.y);
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = config.colors.faces;
    ctx.fill();
    ctx.restore();
}

export function drawPixel(data, i) {
    // [r, g, b, a, r, g, b, a...]

    //r
    data[i] = data[i];
    //g
    data[i + 1] = data[i + 1];
    //b
    data[i + 2] = data[i + 2];
    //a
    data[i + 3] = 100;
}

