const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');

/**
 * Event emitted by the Transport when a change occurs
 * @hideconstructor
 */
class TransportEvent {
  #type = null;
  #time = null;
  #position = null;
  #speed = null;
  #loop = null;
  #loopStart = null;
  #loopEnd = null;
  #tickLookahead = null;

  /** @private */
  constructor(transportState, tickLookahead) {
    this.#type = transportState.eventType;
    this.#time = transportState.time;
    this.#position = transportState.position;
    this.#speed = transportState.speed;
    this.#loop = transportState.loop;
    this.#loopStart = transportState.loopStart;
    this.#loopEnd = transportState.loopEnd;
    this.#tickLookahead = tickLookahead;
  }

  /**
   * Type of the event
   * @type {string}
   */
  get type() {
    return this.#type;
  }

  /**
   * Time of the event
   * @type {number}
   */
  get time() {
    return this.#time;
  }

  /**
   * Position of the event in timeline
   * @type {number}
   */
  get position() {
    return this.#position;
  }

  /**
   * Current speed of the transport (0 is stopped or paused, 1 if started)
   * @type {number}
   */
  get speed() {
    return this.#speed;
  }

  /**
   * Wether the transport is looping
   * @type {boolean}
   */
  get loop() {
    return this.#loop;
  }

  /**
   * Start position of the loop
   * @type {number}
   */
  get loopStart() {
    return this.#loopStart;
  }

  /**
   * Stop position of the loop
   * @type {number}
   */
  get loopEnd() {
    return this.#loopEnd;
  }

  /**
   * Delta time between tick time and event time, in seconds
   * @type {number}
   */
  get tickLookahead() {
    return this.#tickLookahead;
  }

  [customInspectSymbol]() {
    return `\
TransportEvent {
  type: '${this.type}',
  time: ${this.time}
  position: ${this.position}
  speed: ${this.speed}
  loop: ${this.loop}
  loopStart: ${this.loopStart}
  loopEnd: ${this.loopEnd}
  tickLookahead: ${this.tickLookahead}
}\
    `;
  }
}

export default TransportEvent;
