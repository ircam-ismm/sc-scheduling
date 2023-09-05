/**
 * @private
 * Dedicated queue for the Transport
 */
export default class TransportControlEventQueue {
  constructor() {
    this.state = {
      time: 0,
      position: 0,
      speed: 0,
      loop: false,
      loopStart: 0,
      loopEnd: Infinity,
    };

    this.scheduledEvents = [];

    this._speed = 1;
  }

  get next() {
    return this.scheduledEvents[0] || null;
  }

  // attributes of the event queue that don't need to be changed by timed events (tbc)
  get loopStart() {
    return this.state.loopStart;
  }

  set loopStart(value) {
    this.state.loopStart = value;
  }

  get loopEnd() {
    return this.state.loopStart;
  }

  set loopEnd(value) {
    this.state.loopEnd = value;
  }

  /**
   * @param {Object} event
   * @return {Object|null} event or null if discarded
   */
  add(event) {
    // sanitize events
    if (event.type !== 'play'
      && event.type !== 'pause'
      && event.type !== 'seek'
      && event.type !== 'cancel'
      && event.type !== 'loop'
      && event.type !== 'speed'
    ) {
      throw new Error(`Invalid event type: "${event.type}"`);
    }

    // cannot schedule event in the past
    if (this.state && this.state.time > event.time) {
      console.error(`[transportMixin] cannot schedule event in the past, aborting...`);
      return null;
    }

    // cancel is really a real-time event
    if (event.type === 'cancel') {
      // remove all event which time are >= to the one of the cancel event
      // no need to sort the queue
      this.scheduledEvents = this.scheduledEvents.filter(e => e.time < event.time);
      return event; // this is always applied
    }

    this.scheduledEvents.push(event);

    this.scheduledEvents.sort((a, b) => {
      if (a.time < b.time) {
        return -1;
      } else if (a.time > b.time) {
        return 1;
      } else if (a.time === b.time) {
        // keep original order
        return 0;
      }
    });

    // Remove consecutive events of same type (except seek). Note that we want
    // to keep all `seek`, `loop` and `speed` events.
    // e.g. in the `play|seek|seek|play` list we want to keep `play|seek|seek`,
    // the second `play` is redondant
    let eventType = this.state.type;

    this.scheduledEvents = this.scheduledEvents.filter((event, i) => {
      if (event.type === 'seek' || event.type === 'loop'  || event.type === 'speed') {
        return true;
      } else if (event.type !== eventType) {
        eventType = event.type;
        return true;
      } else {
        return false;
      }
    });

    // return null if event has been discarded
    // i.e. scheduled in the past or filtered as duplicate
    return this.scheduledEvents.indexOf(event) !== -1 ? event : null;
  }

  dequeue() {
    const event = this.next;

    const nextState = Object.assign({}, this.state);
    nextState.time = event.time;
    nextState.position = this.getPositionAtTime(event.time);

    // update state infos according to event
    switch (event.type) {
      case 'play':
        nextState.speed = this._speed;
        break;
      case 'pause':
        nextState.speed = 0;
        break;
      case 'seek':
        nextState.position = event.position;
        break;
      case 'loop':
        nextState.loop = event.loop;
        break;
      case 'speed':
        this._speed = event.speed;

        if (nextState.speed > 0) {
          nextState.speed = event.speed;
        }
        break;
    }

    this.scheduledEvents.shift();
    this.state = nextState;

    return Object.assign({}, this.state);
  }

  // return estimated position at time according to state event informations
  getPositionAtTime(time) {
    if (!Number.isFinite(time)) {
      return Infinity;
    }

    const state = this.state;
    // compute position from actual state informations
    let position = state.position + (time - state.time) * state.speed;
    // outside a loop we clamp computed position to last event position
    let lowerBoundary = state.position;

    // apply loop if needed
    if (state.loop && position >= state.loopEnd) {
      position -= state.loopStart;
      position = position % (state.loopEnd - state.loopStart);
      position += state.loopStart;

      // update the time, and position of the state so that `getTimeAtPosition`
      // stays coherent for the engines added to the transport
      const diff = position - state.loopStart;
      state.time = time - diff;
      state.position = state.loopStart;

      // if the state position is greater than loop start (e.g. if we pause in
      // the middle of the loop), loop start should be used as the lower boundary.
      lowerBoundary = Math.min(state.position, this.loopStart);
    }

    return Math.max(position, lowerBoundary);
  }

  // return estimated time at position according to state event informations
  getTimeAtPosition(position) {
    // Infinity * 0 give NaN so handle Infinity separately
    if (!Number.isFinite(position)) {
      return Infinity;
    }

    return this.state.time + (position - this.state.position) * this.state.speed;
  }
}
