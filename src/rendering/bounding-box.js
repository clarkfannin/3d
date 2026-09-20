export default function getBoundingBox(facePoints) {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const point of facePoints) {
        if (point.x < xMin) xMin = point.x;
        if (point.x > xMax) xMax = point.x;
        if (point.y < yMin) yMin = point.y;
        if (point.y > yMax) yMax = point.y;
    }
    return { xMin, xMax, yMin, yMax };
};