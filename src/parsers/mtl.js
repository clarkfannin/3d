export default function parseMtl(text) {
	// after parsing the obj, we have an array of mesh objects
	// each mesh object has a texture path on it
	// the mtl maps the texture path to the name
    const mtlMap = {};
	const objects = text.split(/^newmtl /gm).filter((l) => l !== "");
	for (let i = 0; i < objects.length; i++) {
		const lines = objects[i].split("\n").filter((l) => !l.startsWith("#"));
        const mtlName = lines[0];
		for (const line of lines) {
			if (line.startsWith("map_Kd")) {
                const mtlPath = line.split(" ")[1];
                mtlMap[mtlName] = mtlPath;
			}
		}
	}

    return mtlMap;
}
