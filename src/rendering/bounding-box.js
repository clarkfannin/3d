export default function getBoundingBox(facePoints) {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const point of facePoints) {
        if (point.x < xMin) xMin = Math.floor(point.x);
        if (point.x > xMax) xMax = Math.ceil(point.x);
        if (point.y < yMin) yMin = Math.floor(point.y);
        if (point.y > yMax) yMax = Math.ceil(point.y);
    }
    return { xMin, xMax, yMin, yMax };
};