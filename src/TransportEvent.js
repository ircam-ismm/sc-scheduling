const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');

/**
 *
 *
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

  constructor(transportState, schedulerInfos) {
    this.#type = transportState.eventType;
    this.#time = transportState.time;
    this.#position = transportState.position;
    this.#speed = transportState.speed;
    this.#loop = transportState.loop;
    this.#loopStart = transportState.loopStart;
    this.#loopEnd = transportState.loopEnd;
    this.#tickLookahead = schedulerInfos.tickLookahead;
  }

  get type() {
    return this.#type;
  }

  get time() {
    return this.#time;
  }

  get position() {
    return this.#position;
  }

  get speed() {
    return this.#speed;
  }

  get loop() {
    return this.#loop;
  }

  get loopStart() {
    return this.#loopStart;
  }

  get loopEnd() {
    return this.#loopEnd;
  }

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
