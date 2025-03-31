import EventEmitter from "events";

 
const emitterRegistry : Map<string,EventEmitter> = new Map();
 
/**
* Get or create a singleton EventEmitter by key.
* @param {string} key - The unique key for the EventEmitter.
* @returns {EventEmitter} - The same EventEmitter instance for the given key.
*/
export function getEventEmitter(key: string): EventEmitter | undefined {
    if (!emitterRegistry.has(key)) {
        emitterRegistry.set(key, new EventEmitter());
    }
    return emitterRegistry.get(key);
}
