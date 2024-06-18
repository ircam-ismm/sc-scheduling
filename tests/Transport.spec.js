import { assert } from 'chai';
import { getTime, delay } from '@ircam/sc-utils';

import Transport from '../src/Transport.js';
import TransportEvent from '../src/TransportEvent.js';
import Scheduler from '../src/Scheduler.js';

describe(`# Transport`, () => {
  describe('## constructor', () => {
    it(`should throw if argument 1 is not an instance of Scheduler`, () => {
      assert.throws(() => { const transport = new Transport() });
      assert.throws(() => { const transport = new Transport({}) });
      assert.throws(() => { const transport = new Transport(1) });

      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);
    });
  });

  describe('## start(time)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.start({}));
      assert.throws(() => transport.start(null));
      assert.throws(() => transport.start(-1));
      transport.start(getTime());
    });
  });

  describe('## stop(time)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.stop({}));
      assert.throws(() => transport.stop(null));
      assert.throws(() => transport.stop(-1));
      transport.stop(getTime());
    });
  });

  describe('## pause(time)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.pause({}));
      assert.throws(() => transport.pause(null));
      assert.throws(() => transport.pause(-1));
      transport.pause(getTime());
    });
  });

  describe('## seek(position, time)', () => {
    it('should throw if position is not a finite number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.seek({}, 1));
      assert.throws(() => transport.seek(null, 1));
      assert.throws(() => transport.seek(-Infinity, 1));
      assert.throws(() => transport.seek(+Infinity, 1));
      transport.seek(-1, getTime());
      transport.seek(1, getTime());
    });

    it('should throw if time is not a positive finite number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.seek(0, {}));
      assert.throws(() => transport.seek(0, null));
      assert.throws(() => transport.seek(0, -1));
      assert.throws(() => transport.seek(0, +Infinity));
      // support positive and negative values
      transport.seek(0, getTime());
    });
  });

  describe('## loop(value, time)', () => {
    it('should throw if value is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loop({}, 1));
      assert.throws(() => transport.loop(null, 1));
      assert.throws(() => transport.loop(-1, 1));
      transport.loop(true, getTime());
    });

    it('should throw if time is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loop(true, {}));
      assert.throws(() => transport.loop(true, null));
      assert.throws(() => transport.loop(true, -1));
      transport.loop(true, getTime());
    });
  });


  describe('## loopStart(position, time)', () => {
    it(`should throw if position is not a finite number or -Infinity`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loopStart({}, 0));
      assert.throws(() => transport.loopStart(null, 0));
      assert.throws(() => transport.loopStart(Infinity, 0));

      transport.loopStart(0, getTime());
      transport.loopStart(-Infinity, getTime());
    });

    it.skip(`should throw if given value is greater than or equal to loopEnd`, () => {
      // @todo implement
    });
  });

  describe('## loopEnd(position, time)', () => {
    it(`should throw if value is not a finite number or +Infinity`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loopEnd({}, 0));
      assert.throws(() => transport.loopEnd(null, 0));
      assert.throws(() => transport.loopEnd(-Infinity, 0));

      transport.loopEnd(-1, getTime());
      transport.loopEnd(Infinity, getTime());
    });

    it.skip(`should throw if given value is lower than or equal to loopStart`, () => {
      // @todo implement
    });
  });

  describe('## speed(value, time)', () => {
    it('should throw if value is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.speed({}, 1));
      assert.throws(() => transport.speed(null, 1));
      transport.speed(0.5, 1);
    });

    it('should throw if time is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.speed(-1, {}));
      assert.throws(() => transport.speed(-1, null));
      assert.throws(() => transport.speed(-1, -1));
      transport.speed(-1, getTime());
    });
  });

  describe('## cancel(time)', () => {
    it('should throw if time is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.cancel({}));
      assert.throws(() => transport.cancel(null));
      assert.throws(() => transport.cancel(-1));
      transport.cancel(getTime());
    });
  });

  describe('## add(processor)', () => {
    it(`should throw if argument 1 is not a function`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.add({}));
      assert.throws(() => transport.add(1));
      assert.throws(() => transport.add(null));

      transport.add(() => {});
    });
  });

  describe('## has(processor)', () => {
    it(`should throw if argument 1 is not a function`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      const processor1 = () => {};
      const processor2= () => {};
      transport.add(processor1);

      assert.isTrue(transport.has(processor1));
      assert.isFalse(transport.has(processor2));
    });
  });

  describe('## remove(processor)', () => {
    it(`should throw if has not been added to transport`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);
      const processor = () => {};

      assert.throws(() => transport.remove(processor));

      transport.add(processor);
      transport.remove(processor);
    });
  });

  describe('## clear()', () => {
    it(`should throw if has not been added to transport`, async () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);
      // this does not respond to TransportEvent but should be stopped nonetheless
      const processor = (position, _, event) => {
        if (event instanceof TransportEvent) {
          return event.speed > 0 ? position : Infinity;
        }

        return position += 0.01;
      }

      transport.start(getTime());
      transport.add(processor);
      await delay(100);
      // the test should just exit properly
      transport.clear();
    });
  });

  describe('## addEvent()', () => {
    it(`should not throw if adding a null event`, async () => {
      const scheduler = new Scheduler(getTime);
      const master = new Transport(scheduler);
      const slave = new Transport(scheduler);

      const event1 = master.start(getTime());
      const event2 = master.start(getTime()); // event is discarded
      assert.isNull(event2);
      slave.addEvent(event2); // should not throw
    });
  });

  describe('## non scheduled API', () => {
    it(`should support more simple API for non scheduled contexts`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      const now = getTime();
      const event1 = transport.start();
      assert.isBelow(event1.time - now, 1e-3);
      const event2 = transport.stop();
      assert.isBelow(event2.time - now, 1e-3);
      const event3 = transport.pause();
      assert.isBelow(event3.time - now, 1e-3);
      const event4 = transport.seek(1);
      assert.isBelow(event4.time - now, 1e-3);
      const event5 = transport.loop(true);
      assert.isBelow(event5.time - now, 1e-3);
      const event6 = transport.loopStart(-1);
      assert.isBelow(event6.time - now, 1e-3);
      const event7 = transport.loopEnd(1);
      assert.isBelow(event7.time - now, 1e-3);
      const event8 = transport.speed(0.5);
      assert.isBelow(event8.time - now, 1e-3);
      const event9 = transport.cancel();
      assert.isBelow(event9.time - now, 1e-3);
    });
  });

  describe('## Behaviour', () => {
    it(`start at 0, seek at 23.5, pause at 24.5, seek at 0, start, stop`, async function() {
      this.timeout(6 * 1000);

      const scheduler = new Scheduler(() => getTime());
      const transport = new Transport(scheduler);

      const now = getTime();

      const expectedEvents = [
        { type: 'init', position: 0, speed: 0, time: now }, // this is triggered on `ad`
        { type: 'start', position: 0, speed: 1, time: now + 1 },
        { type: 'seek', position: 23.5, speed: 1, time: now + 2 },
        { type: 'pause', position: 24.5, speed: 0, time: now + 3 },
        { type: 'seek', position: 0, speed: 0, time: now + 3 },
        // this one wont be precise because of the of the setTimeout
        { type: 'start', position: 0, speed: 1, time: now + 4 },
        { type: 'stop', position: 0, speed: 0, time: now + 5 },
      ];

      let index = 0;

      const processor = (position, time, event) => {
        console.log('[TransportEvent]', event);
        const expected = expectedEvents[index];
        assert.equal(event.type, expected.type);
        assert.equal(event.position, expected.position);
        assert.equal(event.speed, expected.speed);

        // The first and last 'start'|'end' events wont be very precise because of the `setTimeout`
        if (index > 0 && index < 4) {
          assert.isBelow(Math.abs(event.time - expected.time), 1e-9);
        } else {
          assert.isBelow(Math.abs(event.time - expected.time), 0.005);
        }

        index += 1;
      };

      transport.add(processor);
      // Support
      transport.start(now + 1);
      transport.seek(23.5, now + 2); // seek at position 23.5
      // stop and seek to zero
      transport.pause(now + 3);
      transport.seek(0, now + 3);

      await delay(4000);

      transport.start(getTime());

      await delay(1000);
      transport.stop(getTime());
    });

    it(`start / stop / start / stop`, async function() {
      this.timeout(6000);

      const scheduler = new Scheduler(() => getTime());
      const transport = new Transport(scheduler);

      const now = getTime();

      const processor = (position, time, event) => {
        if (event instanceof TransportEvent) {
          console.log('[TransportEvent]', event);
          return event.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position);
        return position + 0.1;
      };

      transport.add(processor);
      // Support
      transport.start(now);
      transport.stop(now + 1)
      // stop and seek to zero
      transport.start(now + 2);
      transport.stop(now + 3);

      await delay(3500);
    });

    it(`should properly call processor with generic scheduler events -
            start from 0 to 1, pause 1sec, start from 1 to 2, seek to 10, start from 10 to 11, pause `, async function() {
      this.timeout(6000);

      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      const processor = (position, time, event) => {
        if (event instanceof TransportEvent) {
          console.log('[TransportEvent]', position, time, event);
          console.log('[TransportEvent] return', event.speed > 0 ? position : Infinity);
          return event.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position, time, event);
        return position + 0.1;
      };

      transport.add(processor);

      const now = getTime();
      // start from 0 to 1
      transport.start(now);
      transport.pause(now + 1);
      // start from 1 to 2
      transport.start(now + 2);
      // start seek at 10 while continue starting
      transport.seek(10, now + 3);
      transport.stop(now + 4);

      await delay(4500);
    });

    it(`start at 0, loop between 1 and 2`, async function() {
      this.timeout(6000);

      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      // make sure transport event are always triggered before "regular" scheduler ticks
      let transportEventTime = Infinity;
      let transportEventPosition = Infinity;
      let tickTime = -Infinity;

      const processor = (position, time, event) => {
        if (event instanceof TransportEvent) {
          transportEventTime = time;
          transportEventPosition = position;

          // transport events time should be strictly higher than tick time
          assert.isTrue(time > tickTime);

          console.log('[TransportEvent]', position, '\t', time, event);
          console.log('[TransportEvent] return', event.speed > 0 ? position : Infinity);
          return event.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position, '\t', time);

        tickTime = time;

        assert.isTrue(time >= transportEventTime);
        assert.isTrue(position >= transportEventPosition);

        return position + 0.1;
      };

      // start from 0 to 2, then loop between 1 and 2
      transport.add(processor);

      const now = getTime();
      transport.loopStart(1, now);
      transport.loopEnd(2, now);
      transport.loop(true, now);
      transport.start(now);

      await delay(5000);

      transport.remove(processor);
      transport.pause(getTime());
    });

    it(`start at 0, loop between 1 and 2 - speed 0.5`, async function() {
      this.timeout(6000);

      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      // make sure transport event are always triggered before "regular" scheduler ticks
      let transportEventTime = Infinity;
      let transportEventPosition = Infinity;
      let tickTime = -Infinity;

      const processor = (position, time, event) => {
        if (event instanceof TransportEvent) {
          transportEventTime = time;
          transportEventPosition = position;

          // transport events time should be strictly higher than tick time
          assert.isTrue(time > tickTime);

          console.log('[TransportEvent]', position, '\t', time, event);
          console.log('[TransportEvent] return', event.speed > 0 ? position : Infinity);
          return event.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position, '\t', time);

        tickTime = time;

        assert.isTrue(time >= transportEventTime);
        assert.isTrue(position >= transportEventPosition);

        return position + 0.1;
      };

      // start from 0 to 2, then loop between 1 and 2
      transport.add(processor);

      const now = getTime();
      // transport.loopStart(now, 0.5);
      // transport.loopEnd(now, 1);
      // transport.loop(now, true);
      // transport.speed(now, 0.5);
      transport.loopStart(0.5, now);
      transport.loopEnd(1, now);
      transport.loop(true, now);
      transport.speed(0.5, now);
      transport.start(now);

      await delay(5000);

      transport.remove(processor);
      transport.pause(getTime());
    });

    it(`start at -1.5, loop between -0.5 and 5`, async function() {
      this.timeout(6000);
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      // make sure transport event are always triggered before "regular" scheduler ticks
      let transportEventTime = Infinity;
      let transportEventPosition = Infinity;
      let tickTime = -Infinity;

      const processor = (position, time, event) => {
        if (event instanceof TransportEvent) {
          transportEventTime = time;
          transportEventPosition = position;

          // transport events time should be strictly higher than tick time
          assert.isTrue(time > tickTime);

          console.log('[TransportEvent]', position, '\t', time, event);
          console.log('[TransportEvent] return', event.speed > 0 ? position : Infinity);
          return event.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position, '\t', time);

        tickTime = time;

        assert.isTrue(time >= transportEventTime);
        assert.isTrue(position >= transportEventPosition);

        return position + 0.1;
      };

      // start from 0 to 2, then loop between 1 and 2
      transport.add(processor);

      const now = getTime();

      transport.seek(-1.5, now);
      transport.loopStart(-0.5, now);
      transport.loopEnd(0.5, now);
      transport.loop(true, now);
      transport.start(now);

      await delay(5000);

      transport.remove(processor);
      transport.stop(getTime());
    });

    it(`synchronized transports`, async function() {
      this.timeout(8000);

      class Engine {
        constructor(name) {
          this.name = name;
          this.tick = this.tick.bind(this);
          this.reported = false;
        }
        tick(position, time, event) {
          if (event instanceof TransportEvent) {
            console.log(`[${this.name}]`, event, event.speed > 0 ? position : Infinity);
            return event.speed > 0 ? position : Infinity;
          }

          // both master and slave processor should be called before the second start (at 2s)
          if (!this.reported) {
            assert.isTrue(position < 2);
            this.reported = true;
          }

          console.log(`[${this.name}]`, position);
          return position + 0.25;
        }
      }

      const scheduler = new Scheduler(getTime);
      // second 0 - master starts
      const master = new Transport(scheduler);
      const processor1 = new Engine('master');
      master.add(processor1.tick)
      master.start(getTime()); // don't know how to handle that yet

      // second 1 - slave starts
      await delay(1000);
      const slave = new Transport(scheduler, master.serialize());
      const processor2 = new Engine('slave');
      slave.add(processor2.tick);

      // second 2 - pause
      await delay(1000);
      const pauseEvent = master.pause(getTime());
      slave.addEvent(pauseEvent);

      // second 3 - restart
      await delay(1000);
      const startEvent = master.start(getTime());
      slave.addEvent(startEvent);

      // second 4 - stop
      await delay(1000);
      const stopEvent = master.stop(getTime());
      slave.addEvent(stopEvent);
    });
  });
});
