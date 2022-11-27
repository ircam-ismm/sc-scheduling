/**
 * Dedicated queue for transportControlMixin
 */
export default class TransportControlEventQueue {
  constructor() {
    this._queue = [null, null]; // init last and current to null

    this.loopStart = 0;
    this.loopEnd = Infinity;
    this.loop = false;
  }

  get last() {
    return this._queue[0];
  }

  get current() {
    return this._queue[1];
  }

  get next() {
    return this._queue[2];
  }

  /**
   * @param {Object} event
   * @return {Object|null} event or null if discarded
   */
  add(event) {
    const current = this.current;

    // sanitize events
    if (event.type !== 'play'
      && event.type !== 'pause'
      && event.type !== 'seek'
      && event.type !== 'cancel'
    ) {
      throw new Error(`Invalid event type, should be "play", "pause" or "seek"`);
    }

    // cannot schedule event in the past
    if (current && current.time > event.time) {
      console.error(`[transportMixin] cannot schedule event in the past, aborting...`);
      return null;
    }

    // cancel is really a real-time event
    if (event.type === 'cancel') {
      // remove all event which time are >= to the one of the cancel event
      // no need to sort the queue
      this._queue = this._queue.filter(e => e === null || e.time < event.time);
      return event; // this is always applied
    }

    this._queue.push(event);
    // this could probably be simplified and made more efficient by just
    // placing the event manually at its right place
    this._queue.sort((a, b) => {
      if (a === null) {
        return -1;
      } if (b === null & a !== null) {
        return 1;
      } else {
        if (a.time < b.time) {
          return -1;
        } else if (a.time > b.time) {
          return 1;
        } else if (a.time === b.time) {
          // keep original order
          return 0;
        }
      }
    });

    // remove consecutive events of same type (except seek)
    let eventType = null;

    if (this.current) {
      eventType = current.type;
    }

    this._queue = this._queue.filter((event, i) => {
      if (i < 2) { // never filter last and current
        return true;
      }

      // We want to keep all `seek` events. We don't need to update `eventType`
      // because if we have: `play|seek|seek|play` we want to get `play|seek|seek`,
      // the second `play` being redondant
      if (event.type === 'seek') {
        return true;
      } else if (event.type !== eventType) {
        eventType = event.type;
        return true;
      } else {
        return false;
      }
    });

    // update event `position` and `speed` informations according to the new
    // timeline.

    let origin;
    // @note - if this is the first element added (this.next) we use it as
    // reference instead of default values, allows to share computed events on
    // the network and keep the timeline consistency at any point
    if (this.current) {
      origin = this.current;
    } else if (this.next) {
      origin = this.next;
    }
    // recompute positions, and speeds of every next events in the queue
    let time = (origin && origin.time)|| 0;
    let position = (origin && origin.position) || 0;
    let speed = (origin && origin.speed) || 0;

    this._queue.forEach((event, i) => {
      if (i < 2) { // never override last and current positions
        return;
      }

      switch (event.type) {
        case 'play':
          if (event !== origin) {
            event.position = position + (event.time - time) * speed;
          } else if (event === origin && !origin.hasOwnProperty('position')) {
            event.position = 0;
          }

          event.speed = 1;
          break;
        case 'pause':
          if (event !== origin) {
            event.position = position + (event.time - time) * speed;
          } else if (event === origin && !origin.hasOwnProperty('position')) {
            event.position = 0;
          }

          event.speed = 0;
          break;
        case 'seek':
          if (event !== origin) {
            event.speed = speed;
          } else if (event === origin && !origin.hasOwnProperty('speed')) {
            event.speed = 0;
          }
          break;
      }

      time = event.time;
      position = event.position;
      speed = event.speed;
    });

    // return event with best estimated values (position and speed) according
    // to current queued events or return null if event has been discarded
    // (i.e. scheduled in the past or filtered as duplicate)
    return this._queue.indexOf(event) !== -1 ? event : null;
  }

  dequeue() {
    this._queue.shift();
    return this.current;
  }

  getSpeedAtTime(time) {
    let targetEvent = null;
    let firstEventIndex = 0;

    for (let i = 0; i < this._queue.length; i++) {
      if (this._queue[i] === null) { // bypass default last and current
         firstEventIndex = i + 1;
         continue;
      }

      // ignore default last and current events
      if (i === firstEventIndex && time < this._queue[i].time) { // first "real" event in queue
        return Infinity;
      } else if (i === this._queue.length - 1) {
        targetEvent = this._queue[i];
        break;
      } else if (time >= this._queue[i].time && time < this._queue[i + 1].time) {
        targetEvent = this._queue[i];
        break;
      }
    }

    if (targetEvent === null) {
      return Infinity;
    } else {
      return targetEvent.speed;
    }
  }

  getPositionAtTime(time) {
    let targetEvent = null;
    let firstEventIndex = 0;

    for (let i = 0; i < this._queue.length; i++) {
      if (this._queue[i] === null) { // bypass default last and current
         firstEventIndex = i + 1;
         continue;
      }

      // ignore default last and current events
      if (i === firstEventIndex && time < this._queue[i].time) { // only 1 "real" event in queue
        // we can't compute any position as we didn't have event yet
        // @note - maybe would be better to return 0
        return Infinity;
      } else if (i === this._queue.length - 1) { // if last event in queue
        targetEvent = this._queue[i];
        break;
      } else if (time >= this._queue[i].time && time < this._queue[i + 1].time) {
        targetEvent = this._queue[i];
        break;
      }
    }

    if (targetEvent === null) {
      return Infinity;
    } else {
      let position = targetEvent.position + (time - targetEvent.time) * targetEvent.speed;

      if (this.loop) {
        if (position < this.loopEnd) {
          return position;
        } else {
          position = position % (this.loopEnd - this.loopStart) + this.loopStart;
          // @note - not sure this is the right way of doing this
          targetEvent.position = position;
          targetEvent.time = time;

          return position;
        }
      } else {
        return position;
      }
    }
  }

  // @note: retrieve time only according to this.current or this next
  // because the relation in not bijective: one position can correspond to different times.
  // -> for now this is only called internally, so it should be ok to be simple here
  getTimeAtPosition(position) {
    const targetEvent = this.current || this.next;

    if (!targetEvent) {
      return Infinity;
    } else {
      // @note - this should be " / speed " if we allowed fractionnal speeds
      // but consider we don't need that for now
      return targetEvent.time + (position - targetEvent.position) * targetEvent.speed;
    }
  }
}
