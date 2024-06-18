export default Transport;
/**
 * Processor to add into a {@link Transport }.
 *
 * The processor will be called back by the Transport on each transport event to
 * define its behavior according to event. Between these events, it can be called
 * as a regular {@link SchedulerProcessor } to do some processing.
 *
 * Note that the APIs of the `SchedulerProcessor` and of a `TransportProcessor`
 * are made in such way that it is possible to implement generic processors that
 * can be added both to a `Scheduler` and to a `Transport`.
 */
export type TransportProcessor = Function;
/**
 * Processor to add into a {@link Transport}.
 *
 * The processor will be called back by the Transport on each transport event to
 * define its behavior according to event. Between these events, it can be called
 * as a regular {@link SchedulerProcessor} to do some processing.
 *
 * Note that the APIs of the `SchedulerProcessor` and of a `TransportProcessor`
 * are made in such way that it is possible to implement generic processors that
 * can be added both to a `Scheduler` and to a `Transport`.
 *
 * @typedef {function} TransportProcessor
 *
 * @param {number} currentPosition - Current position in the timeline of the transport.
 * @param {number} processorTime - Current time in the timeline of the processor
 *  see `Scheduler#options.currentTimeToProcessorTimeFunction`.
 * @param {TransportEvent|SchedulerEvent} event - Event that holds informations
 *  about the current transport or scheduler call.
 */
/**
 * The Transport abstraction allows to define and manipulate a timeline.
 *
 * All provided Transport commands (e.g. start, stop, etc) can be scheduled in the
 * underlying scheduler timeline which makes it usable in distributed and synchronized
 * contexts.
 *
 * @example
 * import { Scheduler, Transport, TransportEvent } from '@ircam/sc-scheduling';
 * import { getTime } from '@ircam/sc-utils';
 *
 * const scheduler = new Scheduler(getTime);
 * const transport = new Transport(scheduler);
 *
 * const processor = (position, time, infos) => {
 *   if (infos instanceof TransportEvent) {
 *      // ask to be called back only when the transport is running
 *      return infos.speed > 0 ? position : Infinity;
 *   }
 *
 *   console.log(position);
 *   return position + 0.1; // ask to be called back every 100ms
 * }
 *
 * transport.add(processor);
 * // start transport in 1 second
 * transport.start(getTime() + 1);
 */
declare class Transport {
    /**
     * @param {Scheduler} scheduler - Instance of scheduler into which the transport
     *  should run
     * @param {object} [initialState=null] - Initial state of the transport, to synchronize
     *  it from another transport state (see `Transport#dumpState()`).
     */
    constructor(scheduler: Scheduler, initialState?: object);
    /**
     * Retrieves the current state and event queue for the transport as a raw object.
     *
     * The returned value can be used to initialize the state of another synchronized
     * transport, cf. `initialValue` argument from constructor.
     *
     * @return {object}
     */
    serialize(): object;
    /**
     * Pointer to the underlying scheduler.
     * @type {Scheduler}
     */
    get scheduler(): Scheduler;
    /**
     * Current time from scheduler timeline, in seconds.
     * @type {number}
     */
    get currentTime(): number;
    /**
     * Current processor time, in seconds.
     * @type {number}
     */
    get processorTime(): number;
    /**
     * Current transport position, in seconds.
     * @type {number}
     */
    get currentPosition(): number;
    /**
     * Estimated position at given time according to the transport current state.
     *
     * @param {number} time - Time to convert to position
     * @return {number}
     */
    getPositionAtTime(time: number): number;
    /**
     * Start the transport at a given time.
     *
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    start(time?: number): object | null;
    /**
     * Stop the transport at a given time, position will be reset to zero.
     *
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    stop(time?: number): object | null;
    /**
     * Pause the transport at a given time, position will remain untouched.
     *
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    pause(time?: number): object | null;
    /**
     * Seek to a new position in the timeline at a given time.
     *
     * @param {number} position - New transport position
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    seek(position: number, time?: number): object | null;
    /**
     * Set the transport loop state at a given time.
     *
     * @param {boolean} value - Loop state
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    loop(value: boolean, time?: number): object | null;
    /**
     * Set the transport loop start point at a given time.
     *
     * @param {number} position - Position of loop start point
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    loopStart(position: number, time?: number): object | null;
    /**
     * Set the transport loop end point at a given time.
     *
     * @param {number} position - Position of loop end point
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    loopEnd(position: number, time?: number): object | null;
    /**
     * Set transport speed at a given time.
     *
     * Note that speed must be strictly positive.
     * _Experimental_
     *
     * @param {number} speed - Speed of the transport, must be strictly > 0
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    speed(value: any, time?: number): object | null;
    /**
     * Cancel all currently scheduled event after the given time.
     *
     * @param {number} [time=this.currentTime] - Time to execute the command
     * @return {object|null} Raw event or `null` if event discarded
     */
    cancel(time?: number): object | null;
    /**
     * Add raw event to the transport queue.
     *
     * Most of the time, you should use the dedicated higher level methods. However
     * this is useful to control several transports from a central event producer.
     * In particular this can be used to synchronize several transport on the network
     * according you have access to a synchronized timeline in which the schedulers
     * are running, cf. e.g. <https://github.com/ircam-ismm/sync>)
     *
     * @example
     * const scheduler = new Scheduler(getTime);
     * const primary = new Transport(scheduler);
     * // create a "copy" of the primary transport
     * const secondary = new Transport(scheduler, primary.serialize());
     * // perform some control command and share it with the secondary transport
     * const event = primary.start(getTime() + 1);
     * // `event` (as well as `primary.serialize()`) could e.g. be sent over the network
     * secondary.addEvent(event);
     *
     * @param {object} event - Raw event as returned by the transport control methods
     */
    addEvent(event: object): any;
    /**
     * Add a list of raw events to the transport queue.
     *
     * @param {object[]} event - List of raw events
     */
    addEvents(eventList: any): any;
    /**
     * Add an processor to the transport.
     *
     * When a processor is added to the transport, it called with an 'init' event
     * to allow it to respond properly to the current state of the transport.
     * For example, if the transport has already been started.
     *
     * @param {TransportProcessor} processor - Engine to add to the transport
     * @throws Throw if the processor has already been added to this or another transport
     */
    add(processor: TransportProcessor): void;
    /**
     * Define if a given processor has been added to the transport.
     *
     * @param {TransportProcessor} processor - Engine to check
     * @return {boolean}
     */
    has(processor: TransportProcessor): boolean;
    /**
     * Remove a processor from the transport.
     *
     * @param {TransportProcessor} processor - Engine to remove from the transport
     * @throws Throw if the processor has not been added to the transport
     */
    remove(processor: TransportProcessor): void;
    /**
     * Remove all processors, cancel all registered transport event and pause transport
     */
    clear(): void;
    #private;
}
import Scheduler from './Scheduler.js';
//# sourceMappingURL=Transport.d.ts.map