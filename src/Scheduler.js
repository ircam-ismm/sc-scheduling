import { isFunction, isNumber } from '@ircam/sc-utils';

import PriorityQueue from './PriorityQueue.js';
import {
  identity,
} from './utils.js';

const kTickLookahead = Symbol('sc-scheduling:tick-lookahead');
const kSchedulerInstance = Symbol('sc-scheduling:scheduler');
// export for tests
export const kSchedulerCompatMode = Symbol('sc-scheduling:compat-mode');

/**
 * Scheduler information provided as third argument of a callback registered
 * in the scheduler
 */
class SchedulerInfos {
  constructor() {
    this[kTickLookahead] = 0;
  }

  /**
   * Delta time between tick time and current time, in seconds
   * @type {Number}
   * @private
   */
  get dt() {
    return this[kTickLookahead];
  }

  /**
   * Delta time between tick time and current time, in seconds
   * @type {Number}
   */
  get tickLookahead() {
    return this[kTickLookahead];
  }
}

/**
 * The `Scheduler` interface implements a lookahead scheduler that can be used to
 * schedule events in an arbitrary timelines.
 * It aims at finding a tradeoff between time precision, real-time responsiveness
 * and the weaknesses of the native timers (i.e. `setTimeout` and `setInterval`)
 *
 * For an in-depth explaination of the pattern, see [https://web.dev/audio-scheduling/](https://web.dev/audio-scheduling/)
 */
class Scheduler {
  #getTimeFunction = null;
  #period = null;
  #lookahead = null;
  #currentTimeToAudioTimeFunction = null;
  #maxEngineRecursion = null;
  #verbose = null;

  #infos = new SchedulerInfos();
  #queue = null;
  #engines = new Set();
  #bindedTick = null;
  #currentTime = null;
  #nextTime = Infinity;
  #timeoutId = null;
  #engineTimeCounterMap = new Map();

  /**
   * @param {function} getTimeFunction - A function which return a time in seconds
   *  that will define the timeline of the scheduler.
   * @param {object} options - Options of the scheduler
   * @param {number} [options.period=0.25] - Period of the scheduler, in seconds
   * @param {number} [options.period=0.1] - Lookahead of the scheduler, in seconds
   * @param {number} [options.queueSize=1e3] - Default size of the queue, i.e.
   *  the number of events that can be scheduled in parallel
   * @param {function} [options.currentTimeToAudioTimeFunction=Identity] - A function
   *  to map between the schduler timeline and the audio timeline
   * @param {number} [options.maxEngineRecursion=100] - Number of maximum calls
   *  at same time for an engine before the engine is rejected from the scheduler
   */
  constructor(getTimeFunction, {
    period = 0.025,
    lookahead = 0.1,
    queueSize = 1e3,
    currentTimeToAudioTimeFunction = identity,
    maxEngineRecursion = 100,
    verbose = false,
  } = {}) {
    if (!isFunction(getTimeFunction)) {
      throw new Error('[sc-scheduling] Invalid value for `getTimeFunction` in `new Scheduler(getTimeFunction)`, should be a function returning a time in seconds');
    }

    // the priority queue
    this.#queue = new PriorityQueue(queueSize);
    // list of engines added to the scheduler
    this.#getTimeFunction = getTimeFunction;
    this.#period = period;
    this.#lookahead = lookahead;
    this.#currentTimeToAudioTimeFunction = currentTimeToAudioTimeFunction;
    this.#maxEngineRecursion = maxEngineRecursion;
    this.#verbose = verbose;
    // bind tick as instance attribute
    this.#bindedTick = this.#tick.bind(this);
  }

  /**
   * Period at which the scheduler checks for events, in seconds.
   * Throws if negative or greater than lookahead.
   * @type {number}
   */
  get period() {
    return this.#period;
  }

  set period(value) {
    if (value < 0 || value >= this.lookahead) {
      throw new Error('[sc-scheduling] Invalid value for period, period must be strictly positive and lower than lookahead');
    }

    this.#period = value;
  }

  /**
   * Lookahead duration in seconds.
   * Throws if negative or lower than period.
   * @type {number}
   */
  get lookahead() {
    return this.#lookahead;
  }

  set lookahead(value) {
    // the value < 0 redondant because period must be > 0, keep this for clarity
    if (value < 0 || value <= this.period) {
      throw new Error('[sc-scheduling] Invalid value for lookahead, lookahead must be strictly positive and greater than period');
    }

    this.#lookahead = value;
  }

  /**
   * Scheduler current logical time.
   * @type {number}
   * @readonly
   */
  get currentTime() {
    return this.#currentTime || this.#getTimeFunction() + this.lookahead;
  }

  /**
   * Scheduler current audio time according to `currentTime`
   * @type {number}
   * @readonly
   */
  get audioTime() {
    return this.#currentTimeToAudioTimeFunction(this.currentTime);
  }

  /**
   * Check whether a given engine has been added to this scheduler
   *
   * @param {object} engine  - Engine to test.
   * @returns {boolean}
   */
  has(engine) {
    // compat mode for old waves TimeEngine API
    if (engine[kSchedulerCompatMode]) {
      engine = engine[kSchedulerCompatMode];
    }
    // ----------------------------------------
    return this.#engines.has(engine);
  }

  /**
   * Execute a function once at a given time,
   *
   * Calling `defer` compensates with a `setTimeout` for the tick lookahead
   * introduced by the scheduling. Can be usefull for example to synchronize
   * audio events which natively scheduled with visuals which have no internal
   * timing/scheduling ability.
   *
   * Be aware that this method will introduce small timing error (order of 1-2ms)
   * due to the `setTimeout`.
   *
   * @param {function} callback - Callback function to schedule.
   * @param {number} time - Time at which the callback should be scheduled.
   * @example
   * const scheduler = new Scheduler(getTime);
   *
   * scheduler.add((currentTime, audioTime) => {
   *   // schedule some audio event
   *   playSomeSoundAt(audioTime);
   *   // defer execution of visual display to compensate the dt
   *   scheduler.defer(displaySomeSynchronizedStuff, currentTime);
   *   // ask the scheduler to call back in 1 second
   *   return currentTime + 1;
   * });
   */
  defer(callback, time) {
    const engine = (currentTime, audioTime, infos) => {
      setTimeout(() => {
        const now = this.#getTimeFunction();
        infos[kTickLookahead] = currentTime - now;

        callback(currentTime, audioTime, infos);
      }, Math.ceil(infos.dt * 1000));

      // clear engine
      return null;
    };

    this.add(engine, time);
  }

  /**
   * Add a time engine to the scheduler.
   *
   * @param {function} engine - Engine to add to the schduler
   * @param {number} [time=0] - Time at which the engine should be launched. The
   *  provided value is clamped to `currentTime`
   */
  add(engine, time = 0) {
    // compat mode for old waves TimeEngine API
    if (isFunction(engine.advanceTime)) {
      // make sure we don't bind twice and always grad the same binded instance
      if (engine[kSchedulerCompatMode] === undefined) {
        engine[kSchedulerCompatMode] = engine.advanceTime.bind(engine);
      }

      engine = engine[kSchedulerCompatMode];
    }
    // end compat mode -------------------------

    if (!isFunction(engine)) {
      delete engine[kSchedulerInstance];
      throw new Error(`[sc-scheduler] Invalid argument for scheduler.add(engine, time), engine should be a function`);
    }

    // prevent that an engine is added to several scheduler
    if (engine[kSchedulerInstance] !== undefined) {
      if (engine[kSchedulerInstance] !== this) {
        throw new Error(`[sc-scheduler] Engine cannot be added to this scheduler, it has already been added to another scheduler`);
      } else {
        throw new Error(`[sc-scheduler] Engine has already been added to this scheduler`);
      }
    }

    time = Math.max(time, this.#currentTime);

    engine[kSchedulerInstance] = this;
    this.#engines.add(engine);
    this.#engineTimeCounterMap.set(engine, { time: null, counter: 0 });
    this.#queue.add(engine, time);

    const nextTime = this.#queue.time;
    this.#resetTick(nextTime, true);
  }

  /**
   * Reset next time of a given engine.
   *
   * If time is not a number, the engine is removed from the scheduler.
   *
   * Be aware that calling this method within an engine callback function won't
   * work, because the reset will be overriden by the engine return value.
   *
   * @param {function} engine - The engine to reschedule
   * @param {number} [time=undefined] - Time at which the engine must be rescheduled
   */
  reset(engine, time = undefined) {
    // compat mode for old waves TimeEngine API
    if (engine[kSchedulerCompatMode]) {
      engine = engine[kSchedulerCompatMode];
    }
    // ----------------------------------------

    if (engine[kSchedulerInstance] !== undefined && engine[kSchedulerInstance] !== this) {
      throw new Error(`[sc-scheduler] Engine cannot be reset on this scheduler, it has been added to another scheduler`);
    }

    if (isNumber(time)) {
      time = Math.max(time, this.#currentTime);
      this.#queue.move(engine, time);
    } else {
      this._remove(engine);
    }

    const nextTime = this.#queue.time;
    this.#resetTick(nextTime, true);
  }

  /**
   * Remove a time engine from the scheduler.
   *
   * @param {function} engine - The engine to reschedule
   */
  remove(engine) {
    // compat mode for old waves TimeEngine API
    if (engine[kSchedulerCompatMode]) {
      // no need to delete the kSchedulerCompatMode key, if the engine is added again
      // we just reuse the already existing binded advanceTime.
      engine = engine[kSchedulerCompatMode];
    }
    // ----------------------------------------

    if (engine[kSchedulerInstance] !== undefined && engine[kSchedulerInstance] !== this) {
      throw new Error(`[sc-scheduler] Engine cannot be removed from this scheduler, it has been added to another scheduler`);
    }

    this._remove(engine);

    const nextTime = this.#queue.time;
    this.#resetTick(nextTime, true);
  }

  /**
   * Clear the scheduler.
   */
  clear() {
    for (let engine of this.#engines) {
      delete engine[kSchedulerInstance];
    }

    this.#queue.clear();
    this.#engines.clear();
    this.#engineTimeCounterMap.clear();
    // just stops the scheduler
    this.#resetTick(Infinity, false);
  }

  _remove(engine) {
    delete engine[kSchedulerInstance];
    // remove from array and queue
    this.#queue.remove(engine);
    this.#engines.delete(engine);
    this.#engineTimeCounterMap.delete(engine);
  }

  /** @private */
  #tick() {
    const tickTime = this.#getTimeFunction();
    let queueTime = this.#queue.time;

    this.#timeoutId = null;

    while (queueTime <= tickTime + this.lookahead) {
      // retreive the engine and advance its time
      const engine = this.#queue.head;
      const engineInfos = this.#engineTimeCounterMap.get(engine);

      // set current time of scheduler to event logical time
      this.#currentTime = queueTime;
      // delta time between the tick call and the scheduled event
      this.#infos[kTickLookahead] = queueTime - tickTime;
      // grab related audio time if a transfert function has been given
      const audioTime = this.#currentTimeToAudioTimeFunction(queueTime);

      let nextTime = engine(queueTime, audioTime, this.#infos);

      // Prevent infinite loops:
      // We don't want to enforce that nextTime > time because it can be handy for e.g.
      // playing chords, but this a common source of problems in development, when
      // such returned value completely freezes the browser...
      if (nextTime === engineInfos.time) {
        engineInfos.counter += 1;

        if (engineInfos.counter >= this.#maxEngineRecursion) {
          console.warn(`[sc-scheduling] maxEngineRecursion (${this.#maxEngineRecursion}) for the same engine at the same time: ${nextTime} has been reached. This is generally due to a implementation issue, thus the engine has been discarded. If you know what you are doing, you should consider increasing the maxEngineRecursion option.`);
          nextTime = Infinity;
        }
      } else {
        engineInfos.time = nextTime;
        engineInfos.counter = 1;
      }

      if (isNumber(nextTime)) {
        this.#queue.move(engine, nextTime);
      } else {
        // we don't want to reset the tick here
        this._remove(engine);
      }

      // grab net event time in queue
      queueTime = this.#queue.time;
    }

    this.#currentTime = null;
    // minimum bound of this.period is ok as we are in the "normal" scheduling behaviour
    this.#resetTick(queueTime, false);
  }

  /**
   * @private
   * @param {number} queueTime - The current queue time
   * @param {boolean} isReschedulingEvent - whether the function has been called
   *  from a modification in the timeline, i.e. add, reset, remove
   */
  #resetTick(queueTime, isReschedulingEvent) {
    // @note - we cant compare previous and next time to avoid rescheduling because
    // timeout is so unstable, i.e. it is sometimes triggered before its deadline,
    // therefore stopping the scheduler for no apparent reason
    const previousNextTime = this.#nextTime;
    this.#nextTime = queueTime;

    clearTimeout(this.#timeoutId);

    if (this.#nextTime !== Infinity) {
      if (this.#verbose && previousNextTime === Infinity) {
        console.log('[sc-scheduling] > scheduler start');
      }

      // Notes on attempt to have a synchronous API if dt is 0 or very small:
      //
      // setTimeout introduce an error of around 1-2ms we should take into account.
      // So if _nextTime is within a 10ms window we execute the #tick in a microtask
      // to minimize the delay, in other cases we can quite safely rely on setTimeout
      //
      // if (dt < 0.01) {
      //   // cf. https://javascript.info/microtask-queue
      //   Promise.resolve().then(this.#tick);
      // }
      //
      // But... this has a lot of undesirable side effects:
      //
      // Note 1: This is all wrong, if reset tick is called several times in a row, the
      // set immediate wont be cancelled, then we might end up with several parallel
      // timeout stacks which is really bad.
      //
      // Note 2: We must stay asynchronous here because if some engine is used to
      // orchestrate other ones behavior (and reset their time), we dont' want to
      // have another engine behing executed before the orchestartor returns its next
      // time.
      //
      // Note 3: Maybe this advocates for making it all more simple, with a loop
      // that just starts and stop, only reschduling when an event is added with
      // the period

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
      console.log('[sc-scheduling] > scheduler stop');
    }
  }
}

export default Scheduler;
