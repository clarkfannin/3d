export default function drawFace (ctx, [p0, p1, p2]) {
    ctx.save();

    ctx.strokeStyle = "red";

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p0.x, p0.y);
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = "white";
    ctx.fill();

    ctx.restore();
};

export function drawPixel(ctx, {x, y, z}){
    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;

    console.log(data)
}

export function drawLine(ctx, startPoint, endPoint) {
    ctx.
}