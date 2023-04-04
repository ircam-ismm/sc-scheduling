import { isFunction } from '@ircam/sc-utils';

import PriorityQueue from './PriorityQueue.js';

// @todo - use Symbol for stuff that are store on the given engine to not pollute
// user code, see priorityQueue too.
const schedulerKey = Symbol('sc-scheduling:scheduler');

/**
 * @private
 *
 * @class SchedulingQueue
 * @extends TimeEngine
 */
class SchedulingQueue {
  constructor() {
    this._queue = new PriorityQueue();
    this._engines = new Set();
  }

  // TimeEngine 'scheduled' interface
  advanceTime(time, audioTime, dt) {
    const engine = this._queue.head;
    const nextTime = engine.advanceTime(time, audioTime, dt);

    // define if we want to enforce that nextTime > time
    //
    // Three cases:
    // - Number is finite: this._queue.move
    // - Number is positive Infinity (Number.POSITIVE_INFINITY): it's removed from the
    // priority queue but kept has a engine
    // - Else remove engine from scheduler

    if (Number.isFinite(nextTime) || nextTime === Number.POSITIVE_INFINITY) {
      // if nextTime === +Infinity the engine will be removed from the queue
      // which does not accept Infinity values, but it will be implicitely re-added
      // to the queue, when `resetEngineTime` is called.
      this._queue.move(engine, nextTime);
    } else {
      engine.master = null;
      this._queue.remove(engine);
      this._engines.delete(engine);
    }

    return this._queue.time;
  }

  // TimeEngine master method to be implemented by derived class
  get currentTime() {
    return 0;
  }

  // call a function at a given time
  defer(fun, time = this.currentTime) {
    if (!(fun instanceof Function)) {
      throw new Error("object cannot be defered by scheduler");
    }

    // make sure that the advanceTime method does not returm anything
    this.add({
      advanceTime: (currentTime, audioTime, dt) => {
        fun(currentTime, audioTime, dt);
        return null;
      },
    }, time);
  }

  // add a time engine to the queue
  add(engine, time = this.currentTime) {
    if (!isFunction(engine.advanceTime)) {
      throw new Error(`[sc-scheduler] Engine cannot be added to scheduler, does not implement the "advanceTime" method`);
    }
    // if (!TimeEngine.implementsScheduled(engine)) {
    //   throw new Error("object cannot be added to scheduler");
    // }

    if (engine.master) {
      throw new Error("object has already been added to a master");
    }

    engine.master = this;

    // add to engines and queue
    this._engines.add(engine);
    const nextTime = this._queue.insert(engine, time);

    // reschedule queue
    this.resetTime(nextTime);
  }

  // remove a time engine from the queue
  remove(engine) {
    // if (engine.master !== this) {
    //   throw new Error("object has not been added to this scheduler");
    // }

    engine.master = null;

    // remove from array and queue
    this._engines.delete(engine);
    const nextTime = this._queue.remove(engine);

    // reschedule queue
    this.resetTime(nextTime);
  }

  // reset next engine time
  resetEngineTime(engine, time = this.currentTime) {
    // if (engine.master !== this) {
    //   throw new Error("object has not been added to this scheduler");
    // }

    let nextTime;

    if (this._queue.has(engine)) {
      nextTime = this._queue.move(engine, time);
    } else {
      nextTime = this._queue.insert(engine, time);
    }

    this.resetTime(nextTime);
  }

  // check whether a given engine is scheduled
  has(engine) {
    return this._engines.has(engine);
  }

  // clear queue
  clear() {
    for (let engine of this._engines) {
      engine.master = null;
    }

    this._queue.clear();
    this._engines.clear();
    this.resetTime(Infinity);
  }
}

export default SchedulingQueue
