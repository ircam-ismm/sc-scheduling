import { isNumber, isFunction } from '@ircam/sc-utils';

import { quantize, cloneDeep, isPositiveNumber } from './utils.js';
import Scheduler from './Scheduler.js';
import TransportEvent from './TransportEvent.js';
import TransportEventQueue from './TransportEventQueue.js';

const kTransportInstance = Symbol('sc-scheduling:transport');

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
class Transport {
  #scheduler = null;
  #bindedTick = null;
  #eventQueue = null;
  #processors = new Map(); // <Processor, wrappedProcessor>
  // we want transport events to be processed before regular processors
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
   * Pointer to the underlying scheduler.
   * @type {Scheduler}
   */
  get scheduler() {
    return this.#scheduler;
  }

  /**
   * Current time from scheduler timeline, in seconds.
   * @type {number}
   */
  get currentTime() {
    return this.#scheduler.currentTime;
  }

  /**
   * Current processor time, in seconds.
   * @type {number}
   */
  get processorTime() {
    return this.#scheduler.processorTime;
  }

  /**
   * Current transport position, in seconds.
   * @type {number}
   */
  get currentPosition() {
    return this.getPositionAtTime(this.currentTime);
  }

  /**
   * Estimated position at given time according to the transport current state.
   *
   * @param {number} time - Time to convert to position
   * @return {number}
   */
  getPositionAtTime(time) {
    return quantize(this.#eventQueue.getPositionAtTime(time));
  }

  /**
   * Start the transport at a given time.
   *
   * @param {number} [time=this.currentTime] - Time to execute the command
   * @return {object|null} Raw event or `null` if event discarded
   */
  start(time = this.currentTime) {
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
   * Stop the transport at a given time, position will be reset to zero.
   *
   * @param {number} [time=this.currentTime] - Time to execute the command
   * @return {object|null} Raw event or `null` if event discarded
   */
  stop(time = this.currentTime) {
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
   * Pause the transport at a given time, position will remain untouched.
   *
   * @param {number} [time=this.currentTime] - Time to execute the command
   * @return {object|null} Raw event or `null` if event discarded
   */
  pause(time = this.currentTime) {
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
   * Seek to a new position in the timeline at a given time.
   *
   * @param {number} position - New transport position
   * @param {number} [time=this.currentTime] - Time to execute the command
   * @return {object|null} Raw event or `null` if event discarded
   */
  seek(position, time = this.currentTime) {
    if (!Number.isFinite(position)) {
      throw new TypeError(`Cannot execute 'seek' on 'Transport': argument 1 (position) should be a finite number`);
    }

    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'seek' on 'Transport': argument 2 (time) should be a positive number`);
    }

    const event = {
      type: 'seek',
      time: quantize(time),
      position: position,
    };

    return this.addEvent(event);
  }

  /**
   * Set the transport loop state at a given time.
   *
   * @param {boolean} value - Loop state
   * @param {number} [time=this.currentTime] - Time to execute the command
   * @return {object|null} Raw event or `null` if event discarded
   */
  loop(value, time = this.currentTime) {
    if (typeof value !== 'boolean') {
      throw new TypeError(`Cannot execute 'loop' on 'Transport': argument 2 (value) should be a boolean`);
    }

    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'loop' on 'Transport': argument 1 (time) should be a positive number`);
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
   * Set the transport loop start point at a given time.
   *
   * @param {number} position - Position of loop start point
   * @param {number} [time=this.currentTime] - Time to execute the command
   * @return {object|null} Raw event or `null` if event discarded
   */
  loopStart(position, time = this.currentTime) {
    if (position !== -Infinity && !Number.isFinite(position)) {
      throw new TypeError(`Cannot execute 'loopStart' on 'Transport': argument 1 (position) should be either a finite number or -Infinity`);
    }

    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'loopStart' on 'Transport': argument 2 (time) should be a positive number`);
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
   * Set the transport loop end point at a given time.
   *
   * @param {number} position - Position of loop end point
   * @param {number} [time=this.currentTime] - Time to execute the command
   * @return {object|null} Raw event or `null` if event discarded
   */
  loopEnd(position, time = this.currentTime) {
    if (position !== Infinity && !Number.isFinite(position)) {
      throw new TypeError(`Cannot execute 'loopStart' on 'Transport': argument 1 (position) should be either a finite number or Infinity`);
    }

    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'loopEnd' on 'Transport': argument 2 (time) should be a positive number`);
    }

    const event = {
      type: 'loop-end',
      time: quantize(time),
      loopEnd: position,
    };

    return this.addEvent(event);
  }

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
  speed(value, time = this.currentTime) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Cannot execute 'speed' on 'Transport': argument 1 (value) should be a positive number`);
    }

    if (!isPositiveNumber(time)) {
      throw new TypeError(`Cannot execute 'speed' on 'Transport': argument 2 (time) should be a positive number`);
    }

    const event = {
      type: 'speed',
      time: quantize(time),
      speed: value,
    };

    return this.addEvent(event);
  }

  /**
   * Cancel all currently scheduled event after the given time.
   *
   * @param {number} [time=this.currentTime] - Time to execute the command
   * @return {object|null} Raw event or `null` if event discarded
   */
  cancel(time = this.currentTime) {
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
   * Add a list of raw events to the transport queue.
   *
   * @param {object[]} event - List of raw events
   */
  addEvents(eventList) {
    return eventList.map(event => this.addEvent(event));
  }

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
  add(processor) {
    if (!isFunction(processor)) {
      throw new TypeError(`Cannot execute 'add' on 'Transport': argument 1 is not a function`);
    }

    if (processor[kTransportInstance] !== undefined) {
      if (processor[kTransportInstance] !== this) {
        throw new DOMException(`Cannot execute 'add' on 'Transport': processor already added to another transport`, 'NotSupportedError');
      } else {
        throw new DOMException(`Cannot execute 'add' on 'Transport': processor already added this transport`, 'NotSupportedError');
      }
    }

    processor[kTransportInstance] = this;

    // infos can be SchedulerInfos or TransportEvent
    const wrappedEngine = (function wrappedEngine(currentTime, processorTime, infos) {
      // execute processor in transport timeline
      const position = this.getPositionAtTime(currentTime); // quantized
      const nextPosition = processor(position, processorTime, infos);

      if (isNumber(nextPosition)) {
        return this.#eventQueue.getTimeAtPosition(nextPosition);
      } else {
        // make sure processors do not remove themselves from the scheduler
        return Infinity;
      }
    }).bind(this);

    this.#processors.set(processor, wrappedEngine);

    // @todo - handle case where transport is in running state
    // add to scheduler at Infinity, children should never be removed from scheduler

    // call processor tick method according to current transport state
    // @todo - using scheduler current time is not good as it may include
    // lookahead
    const currentTime = this.currentTime;
    const processorTime = this.processorTime;
    const state = cloneDeep(this.#eventQueue.state);
    state.eventType = 'init';
    const tickLookahead = state.time - currentTime;
    const transportEvent = new TransportEvent(state, tickLookahead);

    this.#scheduler.add(wrappedEngine, Infinity);
    // allow processor to reset it's position in scheduler
    this.#tickEngine(wrappedEngine, currentTime, processorTime, transportEvent);
  }

  /**
   * Define if a given processor has been added to the transport.
   *
   * @param {TransportProcessor} processor - Engine to check
   * @return {boolean}
   */
  has(processor) {
    return this.#processors.has(processor);
  }

  /**
   * Remove a processor from the transport.
   *
   * @param {TransportProcessor} processor - Engine to remove from the transport
   * @throws Throw if the processor has not been added to the transport
   */
  remove(processor) {
    if (!this.has(processor)) {
      throw new DOMException(`Cannot execute 'remove' on 'Transport': processor does not belong to this transport`, 'NotSupportedError');
    }

    const wrappedEngine = this.#processors.get(processor);
    // remove from scheduler
    this.#scheduler.remove(wrappedEngine);
    this.#processors.delete(processor);
    delete processor[kTransportInstance];
  }

  /**
   * Remove all processors, cancel all registered transport event and pause transport
   */
  clear() {
    for (let processor of this.#processors.keys()) {
      this.remove(processor);
    }

    this.cancel(this.currentTime);
    this.stop(this.currentTime);
  }

  #tick(currentTime, processorTime, schedulerInfos) {
    const state = this.#eventQueue.dequeue();
    const transportEvent = new TransportEvent(state, schedulerInfos.tickLookahead);

    // Propagate transport event to all childrens, so that they can define their
    // position and reset their next time in scheduler.
    //
    // Note that we use the wrapped processor, so all convertions between time and
    // position is done inside the processor itself. Then, we can just propagate the
    // values received from the scheduler in a straightforward way.
    for (let processor of this.#processors.values()) {
      this.#tickEngine(processor, currentTime, processorTime, transportEvent);
    }

    // return time of next transport event
    if (this.#eventQueue.next) {
      return this.#eventQueue.next.time;
    } else {
      return Infinity;
    }
  }

  #tickEngine(processor, currentTime, processorTime, transportEvent) {
    let resetTime;

    try {
      resetTime = processor(currentTime, processorTime, transportEvent);
    } catch(err) {
      console.error(err);
    }

    // @fixme - This can fail due to back and forth conversions between time and position
    // if (resetTime < currentTime) {
    //   console.warn('Handling TransportEvent cannot lead to scheduling in the past, removing faulty processor');
    //   this.#scheduler.remove(processor);
    // }

    // no need for further check or conversion, everything is done in processor wrapper
    this.#scheduler.reset(processor, resetTime);
  }
}

export default Transport;
