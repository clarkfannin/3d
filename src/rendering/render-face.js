export default function renderFace (ctx, [p0, p1, p2]) {
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