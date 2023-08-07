import { isFunction, isNumber } from '@ircam/sc-utils';

import PriorityQueue from './PriorityQueue.js';
import { identity, schedulerKey } from './utils.js';

/**
 *
 * @example
 * import { Scheduler } from 'waves-masters';
 *
 * const getTime = () => new Date().getTime() / 1000;
 * const scheduler = new Scheduler(getTime);
 *
 * const myEngine = {
 *   advanceTime(currentTime) {
 *     console.log(currentTime);
 *     // ask to be called in 1 second
 *     return time + 1;
 *   }
 * }
 *
 * const startTime = Math.ceil(getTime());
 * scheduler.add(myEngine, startTime);
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
    this._verbose = verbose;
    // bookkeeping internal value
    this._currentTime = null;
    this._nextTime = Infinity;
    this._timeoutId = null;

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
   */
  get currentTime() {
    return this._currentTime || this._getTimeFunction() + this.lookahead;
  }

  /**
   * Scheduler current audio time according to `currentTime`
   * @type {number}
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
    return this._engines.has(engine);
  }

  /**
   * Schedule a function at a given time. If time is in the past, is executed immediately.
   * @param {function} callback - Callback function to schedule.
   * @param {number} time - Time at which the callback should be scheduled.
   */
  defer(callback, time) {
    if (!isFunction(callback)) {
      throw new Error('[sc-scheduling] Invalid parameter for `scheduler.defer(callback, time)`, callback should be a function');
    }

    if (!isNumber(time)) {
      throw new Error(`[sc-scheduler] Invalid time for scheduler.defer(func, time)`);
    }

    const engine = {
      advanceTime: (currentTime, audioTime, dt) => {
        callback(currentTime, audioTime, dt);
        // make sure that the engine will be cleared after one call
        return null;
      },
    };

    this.add(engine, time);
  }

  /**
   * Add a time engine to the scheduler. A valid "time engine" can be any object that implements
   * an `advanceTime(currentTime, audioTime, dt)` method. If the engine has already been added
   * to the scheduler, acts as `reset(engine, time)`
   */
  add(engine, time) {
    if (!isFunction(engine.advanceTime)) {
      throw new Error(`[sc-scheduler] Engine cannot be added to scheduler. A valid "time engine" should implement the "advanceTime(currentTime, audioTime, dt)" method`);
    }

    if (!isNumber(time)) {
      throw new Error(`[sc-scheduler] Invalid time for scheduler.add(engine, time)`);
    }

    // prevent that an engine is added to several scheduler
    if (engine[schedulerKey] !== undefined) {
      if (engine[schedulerKey] !== this) {
        throw new Error(`[sc-scheduler] Engine cannot be added to this scheduler, it has already been added to another scheduler`);
      } else {
        throw new Error(`[sc-scheduler] Engine has already been added to this scheduler`);
      }
    }

    engine[schedulerKey] = this;
    this._engines.add(engine);

    const nextTime = this._queue.add(engine, time);
    // use a minimum bound of 0 because the the engine could be added before the next tick time
    this._resetTick(nextTime, 0);
  }

  reset(engine, time) {
    if (engine[schedulerKey] !== undefined && engine[schedulerKey] !== this) {
      throw new Error(`[sc-scheduler] Engine cannot be reset on this scheduler, it has been added to another scheduler`);
    }

    if (!isNumber(time)) {
      throw new Error(`[sc-scheduler] Invalid time for scheduler.reset(engine, time)`);
    }

    const nextTime = this._queue.move(engine, time);
    // use a minimum bound of 0 because the the engine could be reset before the next tick time
    this._resetTick(nextTime, 0);
  }

  // remove a time engine from the queue
  remove(engine) {
    if (engine[schedulerKey] !== undefined && engine[schedulerKey] !== this) {
      throw new Error(`[sc-scheduler] Engine cannot be removed from this scheduler, it has been added to another scheduler`);
    }

    delete engine[schedulerKey];
    // remove from array and queue
    this._engines.delete(engine);
    const nextTime = this._queue.remove(engine);
    // a minimum bound of this.period is right, as there is now way the next time
    // is before the previously defined next time.
    this._resetTick(nextTime, this.period);
  }

    // clear queue
  clear() {
    for (let engine of this._engines) {
      delete engine[schedulerKey];
    }

    this._queue.clear();
    this._engines.clear();
    // just stops the scheduler
    this._resetTick(Infinity, Infinity);
  }

  /** @private */
  _tick() {
    const currentTime = this._getTimeFunction();
    let time = this._nextTime;

    this._timeoutId = null;

    while (time <= currentTime + this.lookahead) {
      // set current time of scheduler to event logical time
      this._currentTime = time;
      // grab related audio time if a transfert function has been given
      const audioTime = this._currentTimeToAudioTimeFunction(time);
      // delta time between the tick call and the scheduled event
      const dt = time - currentTime;
      // retreive the engine and advance its time
      const engine = this._queue.head;
      const nextTime = engine.advanceTime(time, audioTime, dt);

      // @todo quantize nextTime

      // @todo - handle nextTime === time;
      // we don't to enforce nextTime > time because it can handy for e.g. playing
      // chords, but this a common source of problems in development, when an issue
      // here completely freeze the browser...
      if (isNumber(nextTime)) {
        this._queue.move(engine, nextTime);
      } else {
        this.remove(engine);
      }

      // grab net event time in queue
      time = this._queue.time;
    }

    this._currentTime = null;
    // a minimum bound of this.period is right have we are in the "normal"
    // scheduling behaviour
    this._resetTick(time, this.period);
  }

  _resetTick(time, minimumBound) {
    // resetTick has already been called with this time, abort
    if (this._nextTime === time) {
      return;
    }

    clearTimeout(this._timeoutId);

    if (time !== Infinity) {
      if (this._verbose && this._nextTime === Infinity) {
        console.log('[sc-scheduling] > scheduler start');
      }

      const now = this._getTimeFunction();
      // @todo - this.period as minimum bound is not right, e.g. if an engine
      // is reset before `now + this.period`, we should be able to lower this
      // minimum bound on `add` and `reset`
      const timeoutDelay = Math.max(time - now - this.lookahead, minimumBound);
      // next time must be set before tick()
      this._nextTime = time;
      // note that going though the setTimeout (even with zero) will incur a delay
      // of around ~0.2 ms (in node) which is around 10 samples.
      // Without the timeout we have  -0.0000119 which is below the sample.
      if (timeoutDelay === 0) {
        this._tick();
      } else {
        this._timeoutId = setTimeout(this._tick, Math.ceil(timeoutDelay * 1000));
      }
    } else if (this._nextTime !== Infinity) {
      this._nextTime = time;

      if (this._verbose) {
        console.log('[sc-scheduling] > scheduler stop');
      }
    }
  }
}

export default Scheduler;
