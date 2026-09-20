export default function cull(face) {
    const a = face[0];
    const b = face[1];
    const c = face[2];

    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
};