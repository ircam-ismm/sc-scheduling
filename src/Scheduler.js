import {
  isFunction,
  isNumber,
} from '@ircam/sc-utils';

import PriorityQueue from './PriorityQueue.js';
import SchedulerEvent, {
  kTickLookahead,
} from './SchedulerEvent.js';
import {
  identity,
} from './utils.js';

const kSchedulerInstance = Symbol('sc-scheduling:scheduler');
// export for tests
export const kSchedulerCompatMode = Symbol('sc-scheduling:compat-mode');

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
class Scheduler {
  #getTimeFunction = null;
  #period = null;
  #lookahead = null;
  #currentTimeToProcessorTimeFunction = null;
  #maxRecursions = null;
  #verbose = null;

  #event = new SchedulerEvent();
  #queue = null;
  #processors = new Set();
  #bindedTick = null;
  #nextTime = Infinity;
  #timeoutId = null;
  #processorRecursionsInfos = new Map();

  /**
   * @param {function} getTimeFunction - Function that returns a time in seconds,
   *  defining the timeline in which the scheduler is running.
   * @param {object} options - Options of the scheduler
   * @param {number} [options.period=0.02] - Period of the scheduler, in seconds
   * @param {number} [options.period=0.05] - Lookahead of the scheduler, in seconds
   * @param {number} [options.queueSize=1e3] - Default size of the queue, i.e.
   *  the number of events that can be scheduled in parallel
   * @param {function} [options.currentTimeToProcessorTimeFunction=Identity] - Function
   *  that maps between the scheduler timeline and the processors timeline. For
   *  example to map between a synchronized timeline and an AudioContext own timeline.
   * @param {number} [options.maxRecursions=100] - Number of maximum calls
   *  at same time before the processor is rejected from the scheduler
   */
  constructor(getTimeFunction, {
    period = 0.02,
    lookahead = 0.05,
    queueSize = 1e3,
    currentTimeToProcessorTimeFunction = identity,
    // [deprecated]
    currentTimeToAudioTimeFunction = null,
    maxRecursions = 100,
    verbose = false,
  } = {}) {
    if (!isFunction(getTimeFunction)) {
      throw new TypeError(`Cannot construct 'Scheduler': argument 1 should be a function returning a time in seconds`);
    }

    if (!Number.isFinite(period) || period <= 0) {
      throw new RangeError(`Cannot construct 'Scheduler': option 'period' (${period}) must be a strictly positive number`);
    }

    if (!Number.isFinite(lookahead) || lookahead <= 0) {
      throw new RangeError(`Cannot construct 'Scheduler': option 'lookahead' (${lookahead}) must be a strictly positive number`);
    }

    if (lookahead <= period) {
      throw new RangeError(`Cannot construct 'Scheduler': option 'lookahead' (${lookahead}) be greater than period (${period})`);
    }

    if (!Number.isFinite(queueSize) || queueSize <= 0) {
      throw new RangeError(`Cannot construct 'Scheduler': option 'queueSize' (${queueSize}) must be a strictly positive number`);
    }

    if (!Number.isFinite(maxRecursions) || maxRecursions <= 0) {
      throw new RangeError(`Cannot construct 'Scheduler': option 'maxRecursions' (${maxRecursions}) must be a strictly positive number`);
    }

    // sort of backward compatibility
    if (currentTimeToAudioTimeFunction !== null) {
      console.warn(`[Scheduler] 'options.currentTimeToAudioTimeFunction' is deprecated and will be removed in next release, use 'options.currentTimeToProcessorTimeFunction' instead.`);
      currentTimeToProcessorTimeFunction = currentTimeToAudioTimeFunction;
    }

    if (!isFunction(currentTimeToProcessorTimeFunction)) {
      throw new TypeError(`Cannot construct 'Scheduler': option 'currentTimeToProcessorTimeFunction' should be a function`);
    }


    this.#queue = new PriorityQueue(queueSize);
    this.#getTimeFunction = getTimeFunction;
    this.#period = period;
    this.#lookahead = lookahead;
    this.#currentTimeToProcessorTimeFunction = currentTimeToProcessorTimeFunction;
    this.#maxRecursions = maxRecursions;
    this.#verbose = !!verbose;

    // bind tick as instance attribute
    this.#bindedTick = this.#tick.bind(this);
  }

  /**
   * Period of the scheduler, in seconds.
   *
   * Minimum time span between the scheduler checks for events, in seconds.
   * Throws if negative or greater than lookahead.
   *
   * @type {number}
   */
  get period() {
    return this.#period;
  }

  set period(value) {
    if (!Number.isFinite(value) || value <= 0 || value >= this.lookahead) {
      throw new RangeError(`Cannot set 'period' on Scheduler: value must be strictly positive and lower than lookahead`);
    }

    this.#period = value;
  }

  /**
   * Lookahead duration, in seconds.
   * Throws if negative or lower than period.
   * @type {number}
   */
  get lookahead() {
    return this.#lookahead;
  }

  set lookahead(value) {
    if (!Number.isFinite(value) || value <= 0 || value <= this.period) {
      throw new RangeError(`Cannot set 'lookahead' on Scheduler: value must be strictly positive and greater than period`);
    }

    this.#lookahead = value;
  }

  /**
   * Current time in the scheduler timeline, in seconds.
   *
   * Basically an accessor for `getTimeFunction` parameter given in constructor.
   *
   * @type {number}
   */
  get currentTime() {
    // @note 2024/06 - tickTime was not null only within #tick which is sychronous.
    // So there was no way to read it, except within processors which already received
    // the value as argument.
    // In all other cases this was just returning `current time + lookahead` which
    // was not really useful.
    // return this.#tickTime || this.#getTimeFunction() + this.lookahead;

    return this.#getTimeFunction();
  }

  /**
   * [deprecated] Scheduler current audio time according to `currentTime`
   * @type {number}
   */
  get audioTime() {
    console.warn(`[Scheduler] 'audioTime' getter is deprecated and will be removed in next release, use 'processorTime' instead.`);
    return this.#currentTimeToProcessorTimeFunction(this.currentTime);
  }

  /**
   * Processor time, in seconds, according to `currentTime` and the transfert
   * function provided in `options.currentTimeToProcessorTimeFunction`.
   *
   * If `options.currentTimeToProcessorTimeFunction` has not been set, is equal
   * to `currentTime`.
   *
   * @type {number}
   */
  get processorTime() {
    return this.#currentTimeToProcessorTimeFunction(this.currentTime);
  }

  /**
   * Execute a function once at a given time.
   *
   * Calling `defer` compensates for the tick lookahead introduced by the scheduling
   * with a `setTimeout`. Can be usefull for example to synchronize audio events
   * which natively scheduled with visuals which have no internal timing/scheduling
   * ability.
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
  defer(deferedProcessor, time) {
    const processor = (currentTime, processorTime, event) => {
      setTimeout(() => {
        const now = this.#getTimeFunction();
        event[kTickLookahead] = currentTime - now;

        deferedProcessor(currentTime, processorTime, event);
      }, Math.ceil(event.tickLookahead * 1000));

      // clear processor
      return null;
    };

    this.add(processor, time);
  }

  /**
   * Check whether a given processor has been added to this scheduler
   *
   * @param {SchedulerProcessor} processor  - Processor to test.
   * @returns {boolean}
   */
  has(processor) {
    // compat mode for old waves TimeEngine API
    if (processor[kSchedulerCompatMode]) {
      processor = processor[kSchedulerCompatMode];
    }
    // ----------------------------------------
    return this.#processors.has(processor);
  }

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
  add(processor, time = this.currentTime, priority = 0) {
    // compat mode for old waves TimeEngine API
    if (isFunction(processor.advanceTime)) {
      // make sure we don't bind twice and always grad the same binded instance
      if (processor[kSchedulerCompatMode] === undefined) {
        processor[kSchedulerCompatMode] = processor.advanceTime.bind(processor);
      }

      processor = processor[kSchedulerCompatMode];
    }
    // end compat mode -------------------------

    if (!isFunction(processor)) {
      throw new TypeError(`Cannot execute 'add' on Scheduler: argument 1 is not a function`);
    }

    // prevent that a processor is added to several scheduler
    if (processor[kSchedulerInstance] !== undefined) {
      if (processor[kSchedulerInstance] !== this) {
        throw new DOMException(`Cannot execute 'add' on Scheduler: Processor belongs to another scheduler`, 'NotSupportedErrror');
      } else {
        throw new DOMException(`Cannot execute 'add' on Scheduler: Processor has already been added to this scheduler`, 'NotSupportedErrror');
      }
    }

    processor[kSchedulerInstance] = this;
    this.#processors.add(processor);
    this.#processorRecursionsInfos.set(processor, { time: null, counter: 0 });
    this.#queue.add(processor, time, priority);

    const queueTime = this.#queue.time;
    this.#resetTick(queueTime, true);
  }

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
  reset(processor, time = undefined) {
    // compat mode for old waves TimeEngine API
    if (processor[kSchedulerCompatMode]) {
      processor = processor[kSchedulerCompatMode];
    }
    // ----------------------------------------

    if (!this.has(processor)) {
      throw new DOMException(`Cannot execute 'reset' on Scheduler: Processor has not been added to this scheduler`, 'NotSupportedError');
    }

    if (isNumber(time)) {
      // reset recursion counter
      const processorInfos = this.#processorRecursionsInfos.get(processor);
      processorInfos.time = time;
      processorInfos.counter = 1;
      // move processor inside queue
      this.#queue.move(processor, time);
    } else {
      this.#remove(processor);
    }

    const queueTime = this.#queue.time;
    this.#resetTick(queueTime, true);
  }

  /**
   * Remove a processor from the scheduler.
   *
   * @param {SchedulerProcessor} processor - The processor to reschedule
   */
  remove(processor) {
    // compat mode for old waves TimeEngine API
    if (processor[kSchedulerCompatMode]) {
      // no need to delete the kSchedulerCompatMode key, if the processor is added again
      // we just reuse the already existing binded advanceTime.
      processor = processor[kSchedulerCompatMode];
    }
    // ----------------------------------------

    if (!this.has(processor)) {
      throw new DOMException(`Cannot execute 'reset' on Scheduler: Processor has not been added to this scheduler`, 'NotSupportedError');
    }

    this.#remove(processor);

    const queueTime = this.#queue.time;
    this.#resetTick(queueTime, true);
  }

  /**
   * Clear the scheduler.
   */
  clear() {
    for (let processor of this.#processors) {
      delete processor[kSchedulerInstance];
    }

    this.#queue.clear();
    this.#processors.clear();
    this.#processorRecursionsInfos.clear();
    // just stops the scheduler
    this.#resetTick(Infinity, false);
  }

  #remove(processor) {
    delete processor[kSchedulerInstance];
    // remove from array and queue
    this.#queue.remove(processor);
    this.#processors.delete(processor);
    this.#processorRecursionsInfos.delete(processor);
  }

  #tick() {
    const tickTime = this.#getTimeFunction();
    let queueTime = this.#queue.time;

    this.#timeoutId = null;

    while (queueTime <= tickTime + this.lookahead) {
      // retreive the processor and advance its time
      const processor = this.#queue.head;
      const processorInfos = this.#processorRecursionsInfos.get(processor);

      // update SchedulerEvent with current delta time  between the tick call and
      // the scheduled event
      this.#event[kTickLookahead] = queueTime - tickTime;
      // grab related audio time if a transfert function has been given
      const processorTime = this.#currentTimeToProcessorTimeFunction(queueTime);
      let nextTime;

      try {
        nextTime = processor(queueTime, processorTime, this.#event);
      } catch (err) {
        console.warn(`Running processor threw an error, processor removed from scheduler`);
        console.log(err);
        this.#remove(processor);
      }

      // Prevent infinite loops:
      // We don't want to enforce that nextTime > time because it can be handy for e.g.
      // playing chords, but this a common source of problems in development, when
      // such returned value completely freezes the browser...
      if (nextTime === processorInfos.time) {
        processorInfos.counter += 1;

        if (processorInfos.counter >= this.#maxRecursions) {
          console.warn(`\
[Scheduler] maxRecursions (${this.#maxRecursions}) at the same time (${nextTime}) has been reached, processor discarded:
${processor}
This is generally due to a implementation bug, but if you know what you are doing you should consider increasing the 'maxRecursions' option.`);
          nextTime = Infinity;
        }
      } else {
        processorInfos.time = nextTime;
        processorInfos.counter = 1;
      }

      if (isNumber(nextTime)) {
        this.#queue.move(processor, nextTime);
      } else {
        // we don't need to reset the tick here
        this.#remove(processor);
      }

      // grab next event time in queue
      queueTime = this.#queue.time;
    }

    // minimum bound of this.period is ok as we are in the "normal" scheduling behaviour
    this.#resetTick(queueTime, false);
  }

  /**
   * @private
   * @param {number} queueTime - The current queue time
   * @param {boolean} isReschedulingEvent - whether the function has been called
   *  from a modification in the timeline, i.e. add, reset, remove or just from
   *  a regular `#tick``
   */
  #resetTick(queueTime, isReschedulingEvent) {

    // @note - we can't compare previous and next time to avoid rescheduling because
    // timeout are too noisy: i.e. it is sometimes triggered before its deadline,
    // therefore stopping the scheduler for no apparent reason

    const previousNextTime = this.#nextTime;
    this.#nextTime = queueTime;

    clearTimeout(this.#timeoutId);

    if (this.#nextTime !== Infinity) {
      if (this.#verbose && previousNextTime === Infinity) {
        console.log('[Scheduler] > scheduler start');
      }

      // @notes - Attempt to have a synchronous API if dt is 0 or very small:
      //
      // [idea] setTimeout introduce an error of around 1-2ms we could take into account.
      // So if _nextTime is within a 10ms window we execute the #tick in a microtask
      // to minimize the delay, in other cases we can quite safely rely on setTimeout
      //
      // if (dt < 0.01) {
      //   // cf. https://javascript.info/microtask-queue
      //   Promise.resolve().then(this.#tick);
      // }
      //
      // [result] But... this has a lot of undesirable side effects:
      //
      // 1. If reset tick is called several times in a row, the set immediate wont
      // be cancelled, then we might end up with several parallel timeout stacks which
      // is really bad.
      //
      // 2. We must stay asynchronous here because if some processor is used to
      // orchestrate other ones behavior (and reset their time), we dont' want to
      // have another processor behing executed before the orchestartor returns its next
      // time.
      //
      // [note/tbc] Maybe this advocates for making it all more simple, with a loop that just
      // starts and stop, only reschduling when an event is added within the period

      const now = this.#getTimeFunction();
      const dt = this.#nextTime - now;
      // if this a rescheduling event (i.e. add, reset, remove), `queueTime` can be
      // within the `period` window, so we just clamp the minimum timeout to 1ms.
      // Note that setTimeout(func, 0), is very noisy and quite often executed
      // later than setTimeout(func, 1), cf. tests/setTimeout-setInterval-accuracy.js
      const minimumBound = isReschedulingEvent ? 1e-3 : this.period;
      const timeoutDelay = Math.max(dt - this.lookahead, minimumBound);

      this.#timeoutId = setTimeout(this.#bindedTick, Math.ceil(timeoutDelay * 1000));

    } else if (this.#verbose && previousNextTime !== Infinity) {
      console.log('[Scheduler] > scheduler stop');
    }
  }
}

export default Scheduler;
