import { isNumber, isFunction } from '@ircam/sc-utils';

import { quantize, cloneDeep, isPositiveNumber } from './utils.js';
import Scheduler from './Scheduler.js';
import TransportEvent from './TransportEvent.js';
import TransportEventQueue from './TransportEventQueue.js';

const kTransportInstance = Symbol('sc-scheduling:transport');

/**
 * The Transport abstraction allows to define and manipulate a timeline.
 *
 * @example
 * import { Scheduler, Transport, TransportEvent } from '@ircam/sc-scheduling';
 * import { getTime } from '@ircam/sc-utils';
 *
 * const scheduler = new Scheduler(getTime);
 * const transport = new Transport(scheduler);
 *
 * const engine = (position, time, infos) => {
 *   if (infos instanceof TransportEvent) {
 *      // ask to be called back only when the transport is running
 *      return infos.speed > 0 ? position : Infinity;
 *   }
 *
 *   console.log(position);
 *   return position + 0.1; // ask to be called back every 100ms
 * }
 */
class Transport {
  #scheduler = null;
  #bindedTick = null;
  #eventQueue = null;
  #engines = new Map(); // <Engine, wrappedFunction>
  // we want transport events to be processed before regular engines
  #queuePriority = 1e3;

  /**
   * @param {Scheduler} scheduler - Instance of scheduler into which the transport
   *  should run
   * @param {object} [initialState=null] - Initial state of the transport, to synchronize
   *  it from another transport state (see `Transport#dumpState()`).
   */
  constructor(scheduler, initialState = null) {
    if (!(scheduler instanceof Scheduler)) {
      throw new TypeError(`Cannot construct 'Transport': Argument 1 must be an instance of Scheduler`);
    }

    this.#scheduler = scheduler;
    // init event queue state with current scheduler time, we can't assume
    // the transport is created at the beginning of the process
    this.#eventQueue = new TransportEventQueue(this.#scheduler.currentTime);
    this.#bindedTick = this.#tick.bind(this);

    if (initialState !== null) {
      this.#eventQueue.state = initialState.currentState;
      // init scheduler
      this.addEvents(initialState.scheduledEvents);
    }
  }

  /**
   * Retrieves the current state and event queue for the transport as a raw object.
   *
   * The returned value can be used to initialize the state of another synchronized
   * transport, cf. `initialValue` argument from constructor.
   *
   * @return {object}
   */
  serialize() {
    return {
      currentState: cloneDeep(this.#eventQueue.state),
      scheduledEvents: cloneDeep(this.#eventQueue.scheduledEvents),
    };
  }

  /**
   * Underlying scheduler
   * @type {Scheduler}
   */
  get scheduler() {
    return this.#scheduler;
  }

  // get currentPosition() {}

  /**
   * Scheduler current time
   * @type {Scheduler}
   */
  get currentTime() {
    return this.#scheduler.currentTime;
  }

  /**
   * Scheduler current audio time
   * @type {Scheduler}
   */
  get processorTime() {
    return this.#scheduler.processorTime;
  }

  /**
   * Start the transport at a given time
   * @param {number} time - Time to execute the command
   */
  start(time) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'start' on 'Transport': argument 1 (time) should be a positive number`);
    }

    const event = {
      type: 'start',
      time: quantize(time),
    };

    return this.addEvent(event);
  }

  /**
   * Stop the transport at a given time, position will be reset to zero
   * @param {number} time - Time to execute the command
   */
  stop(time) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'stop' on 'Transport': argument 1 (time) should be a positive number`);
    }

    const event = {
      type: 'stop',
      time: quantize(time),
    };

    return this.addEvent(event);
  }

  /**
   * Pause the transport at a given time, position will remain untouched
   * @param {number} time - Time to execute the command
   */
  pause(time) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'pause' on 'Transport': argument 1 (time) should be a positive number`);
    }

    const event = {
      type: 'pause',
      time: quantize(time),
    };

    return this.addEvent(event);
  }

  /**
   * Seek to a new position in the timeline
   * @param {number} time - Time to execute the command
   * @param {number} position - New position
   */
  seek(time, position) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'seek' on 'Transport': argument 1 (time) should be a positive number`);
    }

    if (!Number.isFinite(position)) {
      throw new TypeError(`Cannot execute 'seek' on 'Transport': argument 2 (position) should be a finite number`);
    }

    const event = {
      type: 'seek',
      time: quantize(time),
      position: position,
    };

    return this.addEvent(event);
  }

  /**
   * Toggle the transport loop at a given time
   * @param {number} time - Time to execute the command
   * @param {boolean} loop - Loop state
   */
  loop(time, value) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'loop' on 'Transport': argument 1 (time) should be a positive number`);
    }

    if (typeof value !== 'boolean') {
      throw new TypeError(`Cannot execute 'loop' on 'Transport': argument 2 (value) should be a boolean`);
    }

    const event = {
      type: 'loop',
      time: quantize(time),
      loop: value,
    };

    return this.addEvent(event);
  }

  // @todo - How to handle if loopEnd < loopStart as we can't know both avalues in advance?
  // - drop event when it's dequeued?
  /**
   * Define the transport loop start point at a given time
   * @param {number} time - Time to execute the command
   * @param {number} position - Position of loop start point
   */
  loopStart(time, position) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'loopStart' on 'Transport': argument 1 (time) should be a positive number`);
    }

    if (position !== -Infinity && !Number.isFinite(position)) {
      throw new TypeError(`Cannot execute 'loopStart' on 'Transport': argument 2 (position) should be either a finite number or -Infinity`);
    }

    const event = {
      type: 'loop-start',
      time: quantize(time),
      loopStart: position,
    };

    return this.addEvent(event);
  }

  // @todo - How to handle if loopEnd < loopStart as we can't know both avalues in advance?
  // - drop event when it's dequeued?
  /**
   * Define the transport loop end point at a given time
   * @param {number} time - Time to execute the command
   * @param {number} position - Position of loop end point
   */
  loopEnd(time, position) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'loopEnd' on 'Transport': argument 1 (time) should be a positive number`);
    }

    // accept Infnity
    if (position !== Infinity && !Number.isFinite(position)) {
      throw new TypeError(`Cannot execute 'loopStart' on 'Transport': argument 2 (position) should be either a finite number or Infinity`);
    }

    const event = {
      type: 'loop-end',
      time: quantize(time),
      loopEnd: position,
    };

    return this.addEvent(event);
  }

  /**
   * Define the transport speed at a given time
   *
   * _Experimental_
   *
   * @param {number} time - Time to execute the command
   * @param {number} value - Speed to transport time
   */
  speed(time, value) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'speed' on 'Transport': argument 1 (time) should be a positive number`);
    }

    if (!Number.isFinite(value)) {
      throw new TypeError(`Cannot execute 'speed' on 'Transport': argument 2 (value) should be a positive number`);
    }

    const event = {
      type: 'speed',
      time: quantize(time),
      speed: value,
    };

    return this.addEvent(event);
  }

  /**
   * Cancel all currently scheduled event after the given time
   *
   * @param {number} time - Time to execute the command
   */
  cancel(time) {
    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'cancel' on 'Transport': argument 1 (time) should be a positive number`);
    }

    const event = {
      type: 'cancel',
      time: quantize(time),
    };

    return this.addEvent(event);
  }

  /**
   * Add raw event to the transport queue.
   *
   * Most of the time, you should use the dedicated higher level methods. However
   * this is useful to control several transports from a central event producer
   * (e.g. on the network)
   */
  addEvent(event) {
    // make sure we don't crash the transport if we try to add an event that
    // as been discarded when synchronizing several states on a master
    if (event === null) {
      return null;
    }

    // grab next before adding event, as it may be replaced by the new event
    const next = this.#eventQueue.next;
    const enqueued = this.#eventQueue.add(event);

    // cancel events are applied right now, no need to schedule them
    if (enqueued !== null && enqueued.type !== 'cancel') {
      if (!this.#scheduler.has(this.#bindedTick)) {
        // use logical next as it may not be the same as the enqueued event
        // (not sure this is actually possible, but this doesn't hurt...)
        this.#scheduler.add(this.#bindedTick, this.#eventQueue.next.time, this.#queuePriority);
      } else if (!next || enqueued.time < next.time) {
        // reschedule transport if inserted event is before previous next event
        this.#scheduler.reset(this.#bindedTick, enqueued.time);
      }
    }

    // console.log(enqueued);
    return enqueued;
  }

  /**
   * Add a list raw event to the transport queue.
   */
  addEvents(eventList) {
    return eventList.map(event => this.addEvent(event));
  }

  /**
   * Return estimated position at given time according to the transport current state.
   * @param {number} time - Time to convert to position
   */
  getPositionAtTime(time) {
    return quantize(this.#eventQueue.getPositionAtTime(time));
  }

  /**
   * Add an engine to the transport.
   *
   * When a processor is added to the transport, it called with an 'init' event
   * to allow it to respond properly to the current state of the transport.
   * For example, if the transport has already been started.
   *
   * @param {function} engine - Engine to add to the transport
   * @throws Throw if the engine has already been added to this or another transport
   */
  add(engine) {
    if (!isFunction(engine)) {
      throw new TypeError(`Cannot execute 'add' on 'Transport': argument 1 is not a function`);
    }

    if (engine[kTransportInstance] !== undefined) {
      if (engine[kTransportInstance] !== this) {
        throw new DOMException(`Cannot execute 'add' on 'Transport': engine already added to another transport`, 'NotSupportedError');
      } else {
        throw new DOMException(`Cannot execute 'add' on 'Transport': engine already added this transport`, 'NotSupportedError');
      }
    }

    engine[kTransportInstance] = this;

    // infos can be SchedulerInfos or TransportEvent
    const wrappedEngine = (function wrappedEngine(currentTime, processorTime, infos) {
      // execute engine in transport timeline
      const position = this.getPositionAtTime(currentTime); // quantized
      const nextPosition = engine(position, processorTime, infos);

      if (isNumber(nextPosition)) {
        return this.#eventQueue.getTimeAtPosition(nextPosition);
      } else {
        // make sure engines do not remove themselves from the scheduler
        return Infinity;
      }
    }).bind(this);

    this.#engines.set(engine, wrappedEngine);

    // @todo - handle case where transport is in running state
    // add to scheduler at Infinity, children should never be removed from scheduler

    // call engine tick method according to current transport state
    // @todo - using scheduler current time is not good as it may include
    // lookahead
    const currentTime = this.currentTime;
    const processorTime = this.processorTime;
    const state = cloneDeep(this.#eventQueue.state);
    state.eventType = 'init';
    const tickLookahead = state.time - currentTime;
    const transportEvent = new TransportEvent(state, tickLookahead);

    this.#scheduler.add(wrappedEngine, Infinity);
    // allow engine to reset it's position in scheduler
    this.#tickEngine(wrappedEngine, currentTime, processorTime, transportEvent);
  }

  /**
   * Define if a given engine has been added to the transport
   *
   * @param {function} engine - Engine to check
   * @return {boolean}
   */
  has(engine) {
    return this.#engines.has(engine);
  }

  /**
   * Remove an engine from the transport
   *
   * @param {function} engine - Engine to remove from the transport
   * @throws Throw if the engine has not been added to the transport
   */
  remove(engine) {
    if (!this.has(engine)) {
      throw new DOMException(`Cannot execute 'remove' on 'Transport': engine does not belong to this transport`, 'NotSupportedError');
    }

    const wrappedEngine = this.#engines.get(engine);
    // remove from scheduler
    this.#scheduler.remove(wrappedEngine);
    this.#engines.delete(engine);
    delete engine[kTransportInstance];
  }

  /**
   * Remove all engines, cancel all registered transport event and pause transport
   */
  clear() {
    for (let engine of this.#engines.keys()) {
      this.remove(engine);
    }

    this.cancel(this.currentTime);
    this.stop(this.currentTime);
  }

  #tick(currentTime, processorTime, schedulerInfos) {
    const state = this.#eventQueue.dequeue();
    // @todo - implemeent
    const transportEvent = new TransportEvent(state, schedulerInfos.tickLookahead);

    // Propagate transport event to all childrens, so that they can define their
    // position and reset their next time in scheduler.
    //
    // Note that we use the wrapped engine, so all convertions between time and
    // position is done inside the engine itself. Then, we can just propagate the
    // values received from the scheduler in a straightforward way.
    for (let engine of this.#engines.values()) {
      this.#tickEngine(engine, currentTime, processorTime, transportEvent);
    }

    // return time of next transport event
    if (this.#eventQueue.next) {
      return this.#eventQueue.next.time;
    } else {
      return Infinity;
    }
  }

  #tickEngine(engine, currentTime, processorTime, transportEvent) {
    let resetTime;

    try {
      resetTime = engine(currentTime, processorTime, transportEvent);
    } catch(err) {
      console.error(err);
    }

    // @todo - This can fail due to back and forth conversions between time and position
    // Check that resetTime >= currentTime
    // if (resetTime < currentTime) {
    //   console.warn('Handling TransportEvent cannot lead to scheduling in the past, removing faulty engine');
    //   this.#scheduler.remove(engine);
    // }

    // no need for further check or conversion, everything is done in processor wrapper
    this.#scheduler.reset(engine, resetTime);
  }
}

export default Transport;
