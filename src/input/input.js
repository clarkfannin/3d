import { config } from "../config.js";

export function handlePlayerActions(state, dt) {
    const { camera } = state;
    const speed = config.moveSpeed;

    const sinY = Math.sin(camera.yaw);
    const cosY = Math.cos(camera.yaw);

    if (state.keys.has(config.keyBindings.forward)) {
        camera.x -= sinY * speed
        camera.z += cosY * speed;
    }
    
    if (state.keys.has(config.keyBindings.backward)) {
        camera.x += sinY * speed;
        camera.z -= cosY * speed;
    }

    if (state.keys.has(config.keyBindings.left)) {
        camera.yaw += speed;
        //camera.z -= sinY * speed;
    }
    
    if (state.keys.has(config.keyBindings.right)) {
        camera.yaw -= speed;
        //camera.z += sinY * speed;
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
