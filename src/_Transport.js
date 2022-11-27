import scheduledMixin from './scheduledMixin.js';

// small engine that is able to trigger scheduled events
// class Transported {
//   constructor(engine) {

//   }
// }

class Transport {
  constructor() {
    this._engines = new Set();
  }

  onScheduledEvent(e, currentTime, audioTime, dt) {
    const currentPosition = this.getPositionAtTime(currentTime);

    this._engines.forEach(engine => {
      const event = Object.assign(e, { time: currentPosition });
      engine.addScheduledEvent(event);
    });
  }

  add(engine) {
    this._engines.add(engine);

    const oldAdvanceTime = engine.advanceTime;

    engine.advanceTime = (currentTime, audioTime, dt) => {
      const currentPosition = this.getPositionAtTime(currentTime);
      console.log('transport', currentTime, currentPosition);
      const nextPosition = oldAdvanceTime(currentPosition, audioTime, dt);
      const nextTime = this.getTimeAtPosition(nextPosition);

      return nextTime;
    }

    this.master.add(engine, Infinity);
  }
}

scheduledMixin(Transport);

export default Transport;
