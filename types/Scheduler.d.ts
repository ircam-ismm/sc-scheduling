export const kSchedulerCompatMode: any;
export default Scheduler;
/**
 * Processor to add into a {@link Scheduler }.
 *
 * The processor will be called back by the Scheduler at the time it request,
 * do some processing and return the next time at which it wants to be called back.
 *
 * Note that the APIs of the `SchedulerProcessor` and of a `TransportProcessor`
 * are made in such way that it is possible to implement generic processors that
 * can be added both to a `Scheduler` and to a `Transport`.
 */
export type SchedulerProcessor = Function;
/**
 * Processor to add into a {@link Scheduler}.
 *
 * The processor will be called back by the Scheduler at the time it request,
 * do some processing and return the next time at which it wants to be called back.
 *
 * Note that the APIs of the `SchedulerProcessor` and of a `TransportProcessor`
 * are made in such way that it is possible to implement generic processors that
 * can be added both to a `Scheduler` and to a `Transport`.
 *
 * @typedef {function} SchedulerProcessor
 *
 * @param {number} currentTime - Current time in the timeline of the scheduler
 * @param {number} processorTime - Current time in the timeline of the processor
 *  see `Scheduler#options.currentTimeToProcessorTimeFunction`.
 * @param {SchedulerEvent} event - Event that holds informations about the current
 *  scheduler call.
 */
/**
 * The `Scheduler` interface implements a lookahead scheduler that can be used to
 * schedule events in an arbitrary timelines.
 *
 * It aims at finding a tradeoff between time precision, real-time responsiveness
 * and the weaknesses of the native timers (i.e. `setTimeout` and `setInterval`)
 *
 * For an in-depth explaination of the pattern, see <https://web.dev/audio-scheduling/>
 *
 * @example
 * import { Scheduler } from '@ircam/sc-scheduling';
 * import { getTime } from '@ircam/sc-utils';
 *
 * const scheduler = new Scheduler(getTime);
 *
 * const processor = (currentTime, processorTime, infos) => {
 *   console.log(currentTime);
 *   return currentTime + 0.1; // ask to be called back every 100ms
 * }
 *
 * // start processor in 1 second
 * scheduler.add(processor, getTime() + 1);
 */
declare class Scheduler {
    /**
     * @param {function} getTimeFunction - Function that returns a time in seconds,
     *  defining the timeline in which the scheduler is running.
     * @param {object} options - Options of the scheduler
     * @param {number} [options.period=0.25] - Period of the scheduler, in seconds
     * @param {number} [options.period=0.1] - Lookahead of the scheduler, in seconds
     * @param {number} [options.queueSize=1e3] - Default size of the queue, i.e.
     *  the number of events that can be scheduled in parallel
     * @param {function} [options.currentTimeToProcessorTimeFunction=Identity] - Function
     *  that maps between the scheduler timeline and the processors timeline. For
     *  example to map between a synchronized timeline and an AudioContext own timeline.
     * @param {number} [options.maxRecursions=100] - Number of maximum calls
     *  at same time before the processor is rejected from the scheduler
     *
     * @example
     * import { scheduler } from '@ircam/sc-scheduling';
     *
     * const getTime = () => performance.now() / 1000;
     * const scheduler = new Scheduler(getTime);
     * const processor = currentTime => {
     *   console.log(currentTime);
     *   // ask to be called back in 1 sec
     *   return currentTime + 1;
     * }
     * scheduler.add(processor);
     */
    constructor(getTimeFunction: Function, { period, lookahead, queueSize, currentTimeToProcessorTimeFunction, currentTimeToAudioTimeFunction, maxRecursions, verbose, }?: {
        period?: number;
        period?: number;
        queueSize?: number;
        currentTimeToProcessorTimeFunction?: Function;
        maxRecursions?: number;
    });
    set period(value: number);
    /**
     * Period of the scheduler, in seconds.
     *
     * Minimum time span between the scheduler checks for events, in seconds.
     * Throws if negative or greater than lookahead.
     *
     * @type {number}
     */
    get period(): number;
    set lookahead(value: number);
    /**
     * Lookahead duration in seconds.
     * Throws if negative or lower than period.
     * @type {number}
     */
    get lookahead(): number;
    /**
     * Current time in the scheduler timeline.
     *
     * Basically an accessor for `getTimeFunction` parameter given in constructor.
     *
     * @type {number}
     */
    get currentTime(): number;
    /**
     * [deprecated] Scheduler current audio time according to `currentTime`
     * @type {number}
     */
    get audioTime(): number;
    /**
     * Processor time according to `currentTime` and the transfert functioin
     * provided in `options.currentTimeToProcessorTimeFunction`.
     *
     * If `options.currentTimeToProcessorTimeFunction` has not been set, is equal
     * to `currentTime`.
     *
     * @type {number}
     */
    get processorTime(): number;
    /**
     * Execute a function once at a given time.
     *
     * Calling `defer` compensates with a `setTimeout` for the tick lookahead
     * introduced by the scheduling. Can be usefull for example to synchronize
     * audio events which natively scheduled with visuals which have no internal
     * timing/scheduling ability.
     *
     * Be aware that this method will introduce small timing error of 1-2 ms order
     * of magnitude due to the `setTimeout`.
     *
     * @param {SchedulerProcessor} deferedProcessor - Callback function to schedule.
     * @param {number} time - Time at which the callback should be scheduled.
     * @example
     * const scheduler = new Scheduler(getTime);
     *
     * scheduler.add((currentTime, processorTime) => {
     *   // schedule some audio event
     *   playSomeSoundAt(processorTime);
     *   // defer execution of visual display to compensate the tickLookahead
     *   scheduler.defer(displaySomeSynchronizedStuff, currentTime);
     *   // ask the scheduler to call back in 1 second
     *   return currentTime + 1;
     * });
     */
    defer(deferedProcessor: SchedulerProcessor, time: number): void;
    /**
     * Check whether a given processor has been added to this scheduler
     *
     * @param {SchedulerProcessor} processor  - Processor to test.
     * @returns {boolean}
     */
    has(processor: SchedulerProcessor): boolean;
    /**
     * Add a processor to the scheduler.
     *
     * Note that given `time` is considered a logical time and that no particular
     * checks are made on it as it might break synchronization between several
     * processors. So if the given time is in the past, the processor will be called
     * in a recursive loop until it reaches current time.
     * This is the responsibility of the consumer code to handle such possible issues.
     *
     * @param {SchedulerProcessor} processor - Processor to add to the scheduler
     * @param {number} [time=this.currentTime] - Time at which the processor should be launched.
     * @param {Number} [priority=0] - Additional priority in case of equal time between
     *  two processor. Higher priority means the processor will processed first.
     */
    add(processor: SchedulerProcessor, time?: number, priority?: number): void;
    /**
     * Reset next time of a given processor.
     *
     * If time is not a number, the processor is removed from the scheduler.
     *
     * Note that given `time` is considered a logical time and that no particular
     * checks are made on it as it might break synchronization between several
     * processors. So if the given time is in the past, the processor will be called
     * in a recursive loop until it reaches current time.
     * This is the responsibility of the consumer code to handle such possible issues.
     *
     * Be aware that calling this method within a processor callback function won't
     * work, because the reset will always be overriden by the processor return value.
     *
     * @param {SchedulerProcessor} processor - The processor to reschedule
     * @param {number} [time=undefined] - Time at which the processor must be rescheduled
     */
    reset(processor: SchedulerProcessor, time?: number): void;
    /**
     * Remove a processor from the scheduler.
     *
     * @param {SchedulerProcessor} processor - The processor to reschedule
     */
    remove(processor: SchedulerProcessor): void;
    /**
     * Clear the scheduler.
     */
    clear(): void;
    #private;
}
//# sourceMappingURL=Scheduler.d.ts.map