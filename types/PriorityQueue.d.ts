export const kQueueTime: any;
export const kQueuePriority: any;
export default PriorityQueue;
/**
 * Priority queue implementing a binary heap.
 *
 * The queue acts as a min heap by default, but can be dynamically changed to a
 * max heap by setting `reverse` to true.
 *
 * The queue uses a Symbol (i.e. `Symbol.for('sc-scheduling-queue-time')`)
 * to store the given queue time into the given object. As such this should not
 * be visible for client code
 *
 * @param {Number} [heapLength=1000] - Default size of the array used to create the heap.
 * @private
 */
declare class PriorityQueue {
    constructor(heapLength?: number);
    /**
     * Time of the first element in the binary heap. Returns Infinity if no object
     * registered in the queue yet.
     * @readonly
     * @returns {Number}
     */
    readonly get time(): number;
    /**
     * First element in the binary heap.
     * @readonly
     * @returns {Number}
     */
    readonly get head(): number;
    /**
     * Insert a new object in the binary heap and sort it.
     *
     * @param {Object} entry - Entry to insert.
     * @param {Number} time - Time at which the entry should be orderer.
     * @param {Number} [priority=0] - Additionnal priority in case of equal time between
     *  two children. Higher priority means the entry will retrieved first.
     * @returns {Number} - Time of the first entry in the heap.
     */
    add(entry: any, time: number, priority?: number): number;
    /**
     * Move a given entry to a new position.
     * @param {Object} entry - Entry to move.
     * @param {Number} time - Time of the entry.
     * @return {Number} - Time of first entry in the heap.
     */
    move(entry: any, time: number): number;
    /**
     * Remove an entry from the heap and fix the heap.
     * @param {Object} entry - Entry to remove.
     * @return {Number} - Time of first entry in the heap.
     */
    remove(entry: any): number;
    /**
     * Clear the queue.
     */
    clear(): void;
    /**
     * Defines if the queue contains the given `entry`.
     *
     * @param {Object} entry - Entry to be checked
     * @return {Boolean}
     */
    has(entry: any): boolean;
    #private;
}
//# sourceMappingURL=PriorityQueue.d.ts.map