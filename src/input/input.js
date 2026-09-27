import { config } from "../config.js";

export function handlePlayerActions(state, dt) {
    const { camera } = state;
    const moveSpeed = config.moveSpeed;
    const turnSpeed = config.turnSpeed;

    const sinY = Math.sin(camera.yaw);
    const cosY = Math.cos(camera.yaw);

    if (state.keys.has(config.keyBindings.forward)) {
        camera.x -= sinY * moveSpeed
        camera.z += cosY * moveSpeed;
    }
    
    if (state.keys.has(config.keyBindings.backward)) {
        camera.x += sinY * moveSpeed;
        camera.z -= cosY * moveSpeed;
    }

    if (state.keys.has(config.keyBindings.left)) {
        camera.yaw += turnSpeed;
    }
    
    if (state.keys.has(config.keyBindings.right)) {
        camera.yaw -= turnSpeed;
    }

    if (state.keys.has(config.keyBindings.up)) {
        camera.y -= moveSpeed;
    }

    if (state.keys.has(config.keyBindings.down)) {
        camera.y += moveSpeed;
    }
}

export default function setupInput(state) {
    document.addEventListener("keydown", (e) => {
        state.keys.add(e.key.toLowerCase());
    });

    document.addEventListener("keyup", (e) => {
        state.keys.delete(e.key.toLowerCase());
    });
}
