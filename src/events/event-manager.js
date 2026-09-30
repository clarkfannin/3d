export default class EventManager {

    static listeners = {};

    static dispatch(queue, event) {
        queue.enqueue(event);
    }

    static processQueue(queue) {
        for (const event of queue.queue) {
            const listener = this.listeners[event.type]
            for (const fn of listener.fns) {
                try {
                    fn(event);
                } catch(error) {
                    console.error(`Error executing "${event.type}" event: ${error}`);
                }
            }
        }
    }

    static subscribe(fn, eventType) {
        this.listeners[eventType].fns.push(fn);
    }
}
