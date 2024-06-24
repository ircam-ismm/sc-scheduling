/**
 * @private
 * Dedicated queue for the Transport
 */
export default class TransportControlEventQueue {
  constructor(currentTime) {
    if (!Number.isFinite(currentTime)) {
      throw new TypeError(`Cannot construct 'TransportEventQueue': argument 1 should be the current time at instanciation`);
    }

    this.state = {
      eventType: null,
      time: currentTime,
      position: 0,
      speed: 0,
      loop: false,
      loopStart: 0,
      loopEnd: Infinity,
    };
    this.previousState = null;

    this.scheduledEvents = [];

    this.speed = 1;
  }

  get next() {
    return this.scheduledEvents[0] || null;
  }

  add(event) {
    if (![
      'start',
      'stop',
      'pause',
      'seek',
      'cancel',
      'loop',
      'loop-start',
      'loop-end',
      'loop-point',
      'speed',
    ].includes(event.type)) {
      throw new Error(`Invalid event type: "${event.type}"`);
    }

    // Prevent scheduling an event before current `state.time`. Note that this does
    // not prevent to schedule an event in the past according to scheduler currentTime,
    // which is desirable to mitigate possible network latencies
    if (this.state.time > event.time) {
      console.error(`Cannot execute 'add' on TransportEventQueue: Given 'event.time' is before current 'state.time'. Aborting...`, event);
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
        return 0; // keep original order
      }
    });

    // Remove consecutive events of same type, disregarding `seek`, `loop`, `loop-start`
    // `loop-end` and `speed` events. For example in the `start|seek|seek|start` list
    // we want to keep `start|seek|seek` (the second `start` is redondant)
    let eventType = this.state.eventType;

    this.scheduledEvents = this.scheduledEvents.filter((event, i) => {
      // the events we want to dedup
      if (['start', 'stop', 'pause', 'cancel'].includes(event.type)) {
        if (event.type !== eventType) {
          eventType = event.type;
          return true;
        } else {
          return false;
        }
      }

      // keep all other events
      return true;
    });

    // return null if event has been discarded
    // i.e. scheduled in the past or filtered as duplicate
    return this.scheduledEvents.indexOf(event) !== -1 ? event : null;
  }

  dequeue() {
    const event = this.next;
    const nextState = Object.assign({}, this.state);

    nextState.eventType = event.type;
    nextState.time = event.time;
    nextState.position = this.getPositionAtTime(event.time);

    // update state infos according to event
    switch (event.type) {
      case 'start':
        nextState.speed = this.speed;
        break;
      case 'stop':
        nextState.position = 0;
        nextState.speed = 0;
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
      case 'loop-start':
        nextState.loopStart = event.loopStart;
        break;
      case 'loop-end':
        nextState.loopEnd = event.loopEnd;
        break;
      case 'loop-point':
        nextState.position = event.position;
        break;
      case 'speed':
        this.speed = event.speed;

        if (nextState.speed > 0) {
          nextState.speed = event.speed;
        }
        break;
    }

    this.scheduledEvents.shift();
    // @todo - we may use this to mitigate some lookahead issue w/ getPositionAtTime
    // i.e. asking for getPositionAtTime(currentTime) while dequeue as already been called
    // this.previousState = this.state;
    this.state = nextState;

    // clear any existing loop point
    this.scheduledEvents = this.scheduledEvents.filter(event => event.type !== 'loop-point');
    // reschedule loop-point event if needed
    if (this.state.loop && this.state.speed > 0) {
      // insert loop-point event in timeline according to what we know, if state
      // change in between the loop-point be reinserted at its right position.
      if (this.state.position < this.state.loopEnd) {
        const event = {
          type: 'loop-point',
          time: this.getTimeAtPosition(this.state.loopEnd),
          position: this.state.loopStart, // is rather abitrary but probably more convenient
        }

        this.add(event);
      }
      // if current position is after loop end, do nothing
    }

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
      position = position - state.loopStart;
      const diff = position % (state.loopEnd - state.loopStart);
      position = state.loopStart + diff;

      // update the time, and position of the state so that `getTimeAtPosition`
      // stays coherent for the engines added to the transport
      state.time = time - diff;
      state.position = state.loopStart;

      // if the state position is greater than loop start (e.g. if we pause in
      // the middle of the loop), loop start should be used as the lower boundary.
      lowerBoundary = Math.min(state.position, state.loopStart);
    }

    return Math.max(position, lowerBoundary);
  }

  // return estimated time accroding to an event and position
  getTimeAtPosition(position) {
    // Infinity * 0 give NaN so handle Infinity separately
    if (!Number.isFinite(position)) {
      return Infinity;
    }

    if (this.state.speed === 0) {
      return this.state.time;
    } else {
      return this.state.time + (position - this.state.position) / this.state.speed;
    }
  }
}
