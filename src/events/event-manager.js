import EventQueue from "./event-queue.js";

class EventManager {
    listeners = {};
    queue = new EventQueue();
    fired = new Set();

    dispatch(event, { once = true } = {}) {
        if (once && this.fired.has(event.type)) return;
        if (once) this.fired.add(event.type);
        this.queue.enqueue(event);
    }

    processQueue() {
        while (this.queue.queue.length) {
            const event = this.queue.dequeue();
            const listener = this.listeners[event.type];
            if (!listener) continue;
            for (const fn of listener.fns) {
                try {
                    fn(event);
                    console.log(`"${event.type}" event executed`);
                } catch (error) {
                    console.error(`Error executing "${event.type}" event:`, error);
                }
            }
        }
    }

    subscribe(fn, eventType) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = { fns: [] };
        }
        this.listeners[eventType].fns.push(fn);
    }
}

export const events = new EventManager();
