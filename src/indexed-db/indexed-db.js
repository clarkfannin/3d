import parseObj from "../parsers/obj-v2.js";

export async function openDB() {
    const request = indexedDB.open("models", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("models", { keyPath: "path" });
    return promisify(request);
}

export function store(db, mode) {
    return db.transaction("models", mode).objectStore("models");
}

export function promisify(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.result);
    });
}

export async function getCachedModel(db, modelPath, modelText) {
    let s;
    s = store(db, "readonly");
    const getReq = s.get(modelPath);
    const getRes = await promisify(getReq);
    if (!getRes) {
        s = store(db, "readwrite");
        const modelObject = parseObj(modelText);
        await s.put({ path: modelPath, modelObject });
        return modelObject;
    }

    return getRes.modelObject;
}