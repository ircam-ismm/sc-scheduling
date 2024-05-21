import { isFunction, isNumber } from '@ircam/sc-utils';

import PriorityQueue from './PriorityQueue.js';
import {
  identity,
  schedulerInstance,
  schedulerCompatMode,
} from './utils.js';

/* @private */
class SchedulerInfos {
  constructor() {
    this._dt = 0;
  }

  /**
   * Delta time between tick time and current time, in seconds
   * @type {Number}
   * @private
   * @readonly
   */
  get dt() {
    return this._dt;
  }
}

/**
 * The `Scheduler` interface implement a lookahead scheduler that can be used to
 * schedule events in an arbitrary timeline.
 * It aims at finding a tradeoff between time precision, real-time responsiveness
 * and the weaknesses of the native timers (i.e.setTimeout and setInterval)
 *
 * For an in-depth explaination of the pattern, see [https://web.dev/audio-scheduling/](https://web.dev/audio-scheduling/)
 */
class Scheduler {
  /**
   * @param {function} getTimeFunction - A function which return a time in seconds
   *  that will define the timeline of the scheduler.
   * @param {object} [options={}] - Options of the scheduler
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
    this._queue = new PriorityQueue(queueSize);
    // list of engines added to the scheduler
    this._engines = new Set();

    this._getTimeFunction = getTimeFunction;
    this._period = -Infinity; // dummy values so we don't fall into error traps at initialization
    this._lookahead = +Infinity; // dummy values so we don't fall into error traps at initialization
    this._currentTimeToAudioTimeFunction = currentTimeToAudioTimeFunction;
    // number of time an engine can be called with the same time before being discarded
    this._maxEngineRecursion = maxEngineRecursion;
    this._verbose = verbose;
    // internal bookkeeping values
    this._currentTime = null;
    this._nextTime = Infinity;
    this._timeoutId = null;
    this._engineTimeCounterMap = new Map();
    this._tickInfos = new SchedulerInfos();

    // init default or user-defined values
    this.period = period;
    this.lookahead = lookahead;

    this._tick = this._tick.bind(this);
  }

  /**
   * Period at which the scheduler checks for events, in seconds.
   * Throws if negative or greater than lookahead.
   * @type {number}
   */
  get period() {
    return this._period;
  }

  set period(value) {
    if (value < 0 || value >= this.lookahead) {
      throw new Error('[sc-scheduling] Invalid value for period, period must be strictly positive and lower than lookahead');
    }

    this._period = value;
  }

  /**
   * Lookahead duration in seconds.
   * Throws if negative or lower than period.
   * @type {number}
   */
  get lookahead() {
    return this._lookahead;
  }

  set lookahead(value) {
    // the value < 0 redondant because period must be > 0, keep this for clarity
    if (value < 0 || value <= this.period) {
      throw new Error('[sc-scheduling] Invalid value for lookahead, lookahead must be strictly positive and greater than period');
    }

    this._lookahead = value;
  }

  /**
   * Scheduler current logical time.
   * @type {number}
   * @readonly
   */
  get currentTime() {
    return this._currentTime || this._getTimeFunction() + this.lookahead;
  }

  /**
   * Scheduler current audio time according to `currentTime`
   * @type {number}
   * @readonly
   */
  get audioTime() {
    return this._currentTimeToAudioTimeFunction(this.currentTime);
  }

  /**
   * Check whether a given engine has been added to this scheduler
   * @param {object} engine  - Engine to test.
   * @returns {boolean}
   */
  has(engine) {
    // compat mode for old waves TimeEngine API
    if (engine[schedulerCompatMode]) {
      engine = engine[schedulerCompatMode];
    }
    // ----------------------------------------
    return this._engines.has(engine);
  }

  /**
   * Execute a function once at a given time, compensating for the dt introduced by
   * the lookahead. Can be usefull for example to synchronize audio (natively scheduled)
   * and visuals which have no internal timing/scheduling ability.
   *
   * Be aware that the defer call will introduce small timing error (order of 1-2ms)
   * due to the setTimeout.
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
        const now = this._getTimeFunction();
        infos._dt = currentTime - now;

        callback(currentTime, audioTime, infos);
      }, Math.ceil(infos.dt * 1000));

      // clear engine
      return null;
    };

    this.add(engine, time);
  }

  /**
   * Add a time engine to the scheduler. A valid "time engine" can be any object that implements
   * an `advanceTime(currentTime, audioTime, dt)` method. If the engine has already been added
   * to the scheduler, acts as `reset(engine, time)`
   * @param {function} engine - @todo - document as type
   * @param {number} time - Time inseconds at which the engine should be executed
   *   first, in the time reference of `getTimeFunction`
   */
  add(engine, time) {
    // compat mode for old waves TimeEngine API
    if (isFunction(engine.advanceTime)) {
      // make sure we don't bind twice and always grad the same binded instance
      if (engine[schedulerCompatMode] === undefined) {
        engine[schedulerCompatMode] = engine.advanceTime.bind(engine);
      }

      engine = engine[schedulerCompatMode];
    }
    // ----------------------------------------

    if (!isFunction(engine)) {
      delete engine[schedulerInstance];
      throw new Error(`[sc-scheduler] Invalid argument for scheduler.add(engine, time), engine should be a function`);
    }

    if (!isNumber(time)) {
      throw new Error(`[sc-scheduler] Invalid time for scheduler.add(engine, time), time should be a number`);
    }

    // prevent that an engine is added to several scheduler
    if (engine[schedulerInstance] !== undefined) {
      if (engine[schedulerInstance] !== this) {
        throw new Error(`[sc-scheduler] Engine cannot be added to this scheduler, it has already been added to another scheduler`);
      } else {
        throw new Error(`[sc-scheduler] Engine has already been added to this scheduler`);
      }
    }

    engine[schedulerInstance] = this;
    this._engines.add(engine);
    this._engineTimeCounterMap.set(engine, { time: null, counter: 0 });
    this._queue.add(engine, time);

    const nextTime = this._queue.time;
    this._resetTick(nextTime, true);
  }

  // if time is NaN, removes engine from scheduler
  // this methos should not be called from within an engine function to reschedule
  // itself, because the given time will be overriden by its return value
  reset(engine, time) {
    // compat mode for old waves TimeEngine API
    if (engine[schedulerCompatMode]) {
      engine = engine[schedulerCompatMode];
    }
    // ----------------------------------------

    if (engine[schedulerInstance] !== undefined && engine[schedulerInstance] !== this) {
      throw new Error(`[sc-scheduler] Engine cannot be reset on this scheduler, it has been added to another scheduler`);
    }

    if (isNumber(time)) {
      this._queue.move(engine, time);
    } else {
      this._remove(engine);
    }

    const nextTime = this._queue.time;
    this._resetTick(nextTime, true);
  }

  // remove a time engine from the queue
  remove(engine) {
    // compat mode for old waves TimeEngine API
    if (engine[schedulerCompatMode]) {
      // no need to delete the schedulerCompatMode key, if the engine is added again
      // we just reuse the already existing binded advanceTime.
      engine = engine[schedulerCompatMode];
    }
    // ----------------------------------------

    if (engine[schedulerInstance] !== undefined && engine[schedulerInstance] !== this) {
      throw new Error(`[sc-scheduler] Engine cannot be removed from this scheduler, it has been added to another scheduler`);
    }

    this._remove(engine);

    const nextTime = this._queue.time;
    this._resetTick(nextTime, true);
  }

  // clear queue
  clear() {
    for (let engine of this._engines) {
      delete engine[schedulerInstance];
    }

    this._queue.clear();
    this._engines.clear();
    this._engineTimeCounterMap.clear();
    // just stops the scheduler
    this._resetTick(Infinity, false);
  }

  _remove(engine) {
    delete engine[schedulerInstance];
    // remove from array and queue
    this._queue.remove(engine);
    this._engines.delete(engine);
    this._engineTimeCounterMap.delete(engine);
  }

  /** @private */
  _tick() {
    const tickTime = this._getTimeFunction();
    let queueTime = this._queue.time;

    this._timeoutId = null;

    while (queueTime <= tickTime + this.lookahead) {
      // retreive the engine and advance its time
      const engine = this._queue.head;
      const engineInfos = this._engineTimeCounterMap.get(engine);

      // set current time of scheduler to event logical time
      this._currentTime = queueTime;
      // delta time between the tick call and the scheduled event
      this._tickInfos._dt = queueTime - tickTime;
      // grab related audio time if a transfert function has been given
      const audioTime = this._currentTimeToAudioTimeFunction(queueTime);

      let nextTime = engine(queueTime, audioTime, this._tickInfos);

      // Prevent infinite loops:
      // We don't want to enforce that nextTime > time because it can be handy for e.g.
      // playing chords, but this a common source of problems in development, when
      // such returned value completely freezes the browser...
      if (nextTime === engineInfos.time) {
        engineInfos.counter += 1;

        if (engineInfos.counter >= this._maxEngineRecursion) {
          console.warn(`[sc-scheduling] maxEngineRecursion (${this._maxEngineRecursion}) for the same engine at the same time: ${nextTime} has been reached. This is generally due to a implementation issue, thus the engine has been discarded. If you know what you are doing, you should consider increasing the maxEngineRecursion option.`);
          nextTime = Infinity;
        }
      } else {
        engineInfos.time = nextTime;
        engineInfos.counter = 1;
      }

      if (isNumber(nextTime)) {
        this._queue.move(engine, nextTime);
      } else {
        // we don't want to reset the tick here
        this._remove(engine);
      }

      // grab net event time in queue
      queueTime = this._queue.time;
    }

    this._currentTime = null;
    // minimum bound of this.period is ok as we are in the "normal" scheduling behaviour
    this._resetTick(queueTime, false);
  }

  /**
   * @private
   * @param {number} queueTime - The current queue time
   * @param {boolean} isReschedulingEvent - whether the function has been called
   *  from a modification in the timeline, i.e. add, reset, remove
   */
  _resetTick(queueTime, isReschedulingEvent) {
    // @note - we cant compare previous and next time to avoid rescheduling because
    // timeout is so unstable, i.e. it is sometimes triggered before its deadline,
    // therefore stopping the scheduler for no apparent reason
    const previousNextTime = this._nextTime;
    this._nextTime = queueTime;

    clearTimeout(this._timeoutId);

    if (this._nextTime !== Infinity) {
      if (this._verbose && previousNextTime === Infinity) {
        console.log('[sc-scheduling] > scheduler start');
      }

      // Notes on attempt to have a synchronous API if dt is 0 or very small:
      //
      // setTimeout introduce an error of around 1-2ms we should take into account.
      // So if _nextTime is within a 10ms window we execute the _tick in a microtask
      // to minimize the delay, in other cases we can quite safely rely on setTimeout
      //
      // if (dt < 0.01) {
      //   // cf. https://javascript.info/microtask-queue
      //   Promise.resolve().then(this._tick);
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

      const now = this._getTimeFunction();
      const dt = this._nextTime - now;
      // if this a rescheduling event (i.e. add, reset, remove), `queueTime` can be
      // within the `period` window, so we just clamp the minimum timeout to 1ms.
      // Note that setTimeout(func, 0), is very noisy and quite often executed
      // later than setTimeout(func, 1), cf. tests/setTimeout-setInterval-accuracy.js
      const minimumBound = isReschedulingEvent ? 1e-3 : this.period;
      const timeoutDelay = Math.max(dt - this.lookahead, minimumBound);

      this._timeoutId = setTimeout(this._tick, Math.ceil(timeoutDelay * 1000));

    } else if (this._verbose && previousNextTime !== Infinity) {
      console.log('[sc-scheduling] > scheduler stop');
    }
  }
}

export default Scheduler;
