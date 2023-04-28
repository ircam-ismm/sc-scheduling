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
    const state = this.state;

    // sanitize events
    if (event.type !== 'play'
      && event.type !== 'pause'
      && event.type !== 'seek'
      && event.type !== 'cancel'
      && event.type !== 'loop'
    ) {
      throw new Error(`Invalid event type: "${event.type}"`);
    }

    // cannot schedule event in the past
    if (state && state.time > event.time) {
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
    // this could probably be simplified and made more efficient by just
    // placing the event manually at its right place
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

    // remove consecutive events of same type (except seek)
    let eventType = state.type;

    this.scheduledEvents = this.scheduledEvents.filter((event, i) => {
      // We want to keep all `seek` and `loop` events.
      // We don't need to update `eventType` because if we have:
      // `play|seek|seek|play` we want to get `play|seek|seek`,
      // the second `play` being redondant
      if (event.type === 'seek' || event.type === 'loop') {
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
    const currentState = this.state;
    const nextState = this.next;

    // update event `position` and `speed` informations according to last event
    switch (nextState.type) {
      case 'play':
        nextState.position = this.getPositionAtTime(nextState.time);
        nextState.speed = 1;
        nextState.loop = currentState.loop;
        break;
      case 'pause':
        nextState.position = this.getPositionAtTime(nextState.time);
        nextState.speed = 0;
        nextState.loop = currentState.loop;
        break;
      case 'seek':
        nextState.speed = currentState.speed;
        nextState.loop = currentState.loop;
        // use position value from the event
        break;
      case 'loop':
        nextState.position = this.getPositionAtTime(nextState.time);
        nextState.speed = currentState.speed;
        // use loop value from the event
    }

    // loop start and end values are not modified through events, so we can just
    // propagate the values on the state
    nextState.loopStart = currentState.loopStart;
    nextState.loopEnd = currentState.loopEnd;

    this.scheduledEvents.shift();
    this.state = nextState;

    return this.state;
  }

  // return estimated position at time according to state event informations
  getPositionAtTime(time) {
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
    return this.state.time + (position - this.state.position) * this.state.speed;
  }
}
