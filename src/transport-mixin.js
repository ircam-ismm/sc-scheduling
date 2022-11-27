import TransportEventQueue from './TransportEventQueue.js';

// @note - wrong name this a scheduledMixin

// rename to TransportControl

// events - actions on the timeline
// - start {TransportEvent}
// - stop {TransportEvent}
// - seek {TransportEvent}
// - pause {TransportEvent}
// - cancel {TransportEvent} - cancel consecutive events at given time

// attributes - these are not events, but qualities of the timeline
// - loopStart {Number}
// - loopEnd {Number}
// - loop {Boolean}

export default obj => {

  let isClass = false;
  // allow applying mixin on class definitions
  if (obj.prototype) {
    isClass = true;
    obj = obj.prototype;
  }

  const oldAdvanceTime = obj.advanceTime;

  // quantify at 1e-9 (this is very subsample accurante...)
  // minimize some floating point weirdness that may happen
  function quantize(val) {
    val = Math.round(val * 1e9) * 1e-9;
    return parseFloat(val.toFixed(9));
  }

  const mixin = {
    _eventQueue: new TransportEventQueue(),

    play(time) {
      const event = {
        type: 'play',
        time: quantize(time),
        speed: 1,
      };

      return this.addScheduledEvent(event);
    },

    // for `pause` and `stop` events, we must define `position` as late as
    // possible to be sure to get the lastest availalble timing informations`
    pause(time) {
      const event = {
        type: 'pause',
        time: quantize(time),
        speed: 0,
        // `position` is defined dynamically by queue
      };

      return this.addScheduledEvent(event); // return computed event or null
    },

    seek(time, position) {
      const event = {
        type: 'seek',
        time: quantize(time),
        position: position,
        // `speed` is defined dynamically by queue
      }

      return this.addScheduledEvent(event); // return computed event or null
    },

    // expose to enable sharing of raw events on the network
    addScheduledEvent(event) {
      this._eventQueue.add(event);

      const nextEvent = this._eventQueue.next;

      if (
        (!this.queueTime && nextEvent) ||
        (nextEvent && nextEvent.time < this.queueTime)
      ) {
        this.master.resetEngineTime(this, nextEvent.time);
      }
    },

    // getSpeedAtTime(time) {
    //   return quantize(this._eventQueue.getSpeedAtTime(time));
    // },

    getPositionAtTime(time) {
      return quantize(this._eventQueue.getPositionAtTime(time));
    },

    // @note - maybe should be private
    // getTimeAtPosition(position) {
    //   return quantize(this._eventQueue.getTimeAtPosition(position));
    // },

    advanceTime(currentTime, audioTime, dt) {
      console.log(currentTime, audioTime, dt);
      // handle case where the engine as been added to scheduler with default
      // values and starts before any start event as been registered
      if (!this._eventQueue.current) {
        if (!this._eventQueue.next) {
          return Infinity;
        } else if (currentTime < this._eventQueue.next.time) {
          return this._eventQueue.next.time;
        }
      }

      let currentPosition;
      let nextPosition;

      // we are in a transport event: dispatch event and return early if needed
      if (this._eventQueue.next && currentTime === this._eventQueue.next.time) {
        const event = this._eventQueue.dequeue();

        // retrieve the computed event position as `getPositionAtTime` may be
        // wrong if several events are scheduled at the same moment, indeed in
        // such case `getPositionAtTime` will compute position from the last
        // event registered at a given time. In such case:
        // ```
        // player.pause(5);
        // player.seek(5, 0);
        // ```
        // position would therefore be computed from the `seek` event even if we are
        // currently handling the `pause` event
        currentPosition = event.position;

        if (this.onScheduledEvent) {
          // allow engine to override it's next position
          nextPosition = this.onScheduledEvent(event, currentPosition, audioTime, dt);
        }

        if (event.speed === 0) {
          if (this._eventQueue.next) {
            return this._eventQueue.next.time;
          } else {
            return Infinity;
          }
        }
      } else {
        currentPosition = this.getPositionAtTime(currentTime, true);
      }

      // - if the `onTransportEvent` has already returned a nextPosition, we bypass this step
      // - engines that dont implement advanceTime (i.e. simple audioBuffer wrapper) are allowed
      if (!Number.isFinite(nextPosition) && oldAdvanceTime) {
        nextPosition = oldAdvanceTime(currentPosition, audioTime, dt);
      }

      // we want to make sure the engine stays in the scheduler for as long as
      // it is transported
      // @note - make sure this behavior doesn't have any weird side effects
      if (!Number.isFinite(nextPosition)) {
        nextPosition = Infinity;
      }

      const nextTime = quantize(this._eventQueue.getTimeAtPosition(nextPosition));

      if (this._eventQueue.next && this._eventQueue.next.time <= nextTime) {
        return this._eventQueue.next.time;
      } else {
        return nextTime;
      }
    },
  };

  // @todo - test every possible syntax to keep `this` safe
  Object.assign(obj, mixin);

  // if this is a class
  if (isClass) {
    return obj.constructor;
  } else {
    return obj;
  }
};
