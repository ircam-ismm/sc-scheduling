import { assert } from 'chai';
import { getTime, delay } from '@ircam/sc-utils';

import Transport from '../src/Transport.js';
import TransportEvent from '../src/TransportEvent.js';
import Scheduler from '../src/Scheduler.js';

/**
 * # TODOS
 *
 * - [ ] add(engine)
 *   // what happens if transport is started?
 * - [ ] has(engine)
 * - [ ] remove(engine)
 * - [x] loop
 * - [x] speed
 * - [x] cancel
 * - [ ] controls / addEvent -> slave one transport to another one
 * - [ ] getState / setState -> slave one transport to an existing one
 * - [ ] addEvent -> remote control
 * - [ ] engine respond to TransportEvent in the past
 */

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

      assert.throws(() => transport.start());
      assert.throws(() => transport.start({}));
      assert.throws(() => transport.start(null));
      assert.throws(() => transport.start(-1));
      transport.start(0);
    });
  });

  describe('## stop(time)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.stop());
      assert.throws(() => transport.stop({}));
      assert.throws(() => transport.stop(null));
      assert.throws(() => transport.stop(-1));
      transport.stop(0);
    });
  });

  describe('## pause(time)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.pause());
      assert.throws(() => transport.pause({}));
      assert.throws(() => transport.pause(null));
      assert.throws(() => transport.pause(-1));
      transport.pause(0);
    });
  });

  describe('## seek(time, position)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.seek({}, 0));
      assert.throws(() => transport.seek(null, 0));
      assert.throws(() => transport.seek(-1, 0));
      transport.seek(0, 0);
    });

    it('should throw if argument 2 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.seek(1, {}));
      assert.throws(() => transport.seek(1, null));
      assert.throws(() => transport.seek(1, -1));
      transport.seek(1, 0);
    });
  });

  describe('## loop(time, value)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loop({}, true));
      assert.throws(() => transport.loop(null, true));
      assert.throws(() => transport.loop(-1, true));
      transport.loop(0, true);
    });

    it('should throw if argument 2 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loop(1, {}));
      assert.throws(() => transport.loop(1, null));
      assert.throws(() => transport.loop(1, -1));
      transport.loop(1, true);
    });
  });


  describe('## loopStart(time, position)', () => {
    it(`should throw if value is not a positive number`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loopStart(0, -1));
      assert.throws(() => transport.loopStart(0, null));

      transport.loopStart(0, 0);
    });

    it.skip(`should throw if given value is greater than or equal to loopEnd`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      transport.loopEnd = 3;
      assert.throws(() => transport.loopStart = 3);
      assert.throws(() => transport.loopStart = 4);
      transport.loopStart = 2;
    });
  });

  describe('## loopEnd(time, position)', () => {
    it(`should throw if value is not a positive number`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loopEnd(0, -1));
      assert.throws(() => transport.loopEnd(0, null));

      transport.loopEnd(0, 1);
    });

    it.skip(`should throw if given value is lower than or equal to loopStart`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      transport.loopStart = 3;
      assert.throws(() => transport.loopEnd = 3);
      assert.throws(() => transport.loopEnd = 2);
      transport.loopEnd = 4;
    });
  });

  describe('## speed(time, value)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.speed({}, -1));
      assert.throws(() => transport.speed(null, -1));
      assert.throws(() => transport.speed(-1, -1));
      transport.speed(0, -1);
    });

    it('should throw if argument 2 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.speed(1, {}));
      assert.throws(() => transport.speed(1, null));
      transport.speed(1, 0.5);
    });
  });

  describe('## cancel(time)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.cancel());
      assert.throws(() => transport.cancel({}));
      assert.throws(() => transport.cancel(null));
      assert.throws(() => transport.cancel(-1));
      transport.cancel(0);
    });
  });

  describe('## add(engine)', () => {
    it(`should throw if argument 1 is not a function`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.add({}));
      assert.throws(() => transport.add(1));
      assert.throws(() => transport.add(null));

      transport.add(() => {});
    });
  });

  describe('## has(engine)', () => {
    it(`should throw if argument 1 is not a function`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      const engine1 = () => {};
      const engine2= () => {};
      transport.add(engine1);

      assert.isTrue(transport.has(engine1));
      assert.isFalse(transport.has(engine2));
    });
  });

  describe('## remove(engine)', () => {
    it(`should throw if has not been added to transport`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);
      const engine = () => {};

      assert.throws(() => transport.remove(engine));

      transport.add(engine);
      transport.remove(engine);
    });
  });

  describe('## clear()', () => {
    it(`should throw if has not been added to transport`, async () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);
      // this does not respond to TransportEvent but should be stopped nonetheless
      const engine = position => position += 0.01;

      transport.add(engine);
      transport.start(getTime());

      await delay(1000);
      // the test should just exit properly
      transport.clear();
    });
  });

  describe('## Behaviour', () => {
    it(`start at 0, seek at 23.5, pause at 24.5, seek at 0, start`, async function() {
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
      ];

      let index = 0;

      const engine = (position, time, event) => {
        console.log('[TransportEvent]', event);
        const expected = expectedEvents[index];
        assert.equal(event.type, expected.type);
        assert.equal(event.position, expected.position);
        assert.equal(event.speed, expected.speed);

        // The first and last 'start' event wont be very precise because of the `setTimeout`
        if (index > 0 && index < 4) {
          assert.isBelow(Math.abs(event.time - expected.time), 1e-9);
        } else {
          assert.isBelow(Math.abs(event.time - expected.time), 0.005);
        }

        index += 1;
      };

      transport.add(engine);
      // Support
      transport.start(now + 1);
      transport.seek(now + 2, 23.5); // seek at position 23.5
      // stop and seek to zero
      transport.pause(now + 3);
      transport.seek(now + 3, 0);

      await delay(4000);

      transport.start(getTime());

      await delay(1000);
    });

    it(`start / stop / start / stop`, async function() {
      this.timeout(6000);

      const scheduler = new Scheduler(() => getTime());
      const transport = new Transport(scheduler);

      const now = getTime();

      const engine = (position, time, event) => {
        if (event instanceof TransportEvent) {
          console.log('[TransportEvent]', event);
          return event.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position);
        return position + 0.1;
      };

      transport.add(engine);
      // Support
      transport.start(now);
      transport.stop(now + 1)
      // stop and seek to zero
      transport.start(now + 2);
      transport.stop(now + 3);

      await delay(4000);
    });

    it(`should properly call engine with generic scheduler events -
            start from 0 to 1, pause 1sec, start from 1 to 2, seek to 10, start from 10 to 11, pause `, async function() {
      this.timeout(6000);

      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      const engine = (position, time, event) => {
        if (event instanceof TransportEvent) {
          console.log('[TransportEvent]', position, time, event);
          console.log('[TransportEvent] return', event.speed > 0 ? position : Infinity);
          return event.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position, time, event);
        return position + 0.1;
      };

      transport.add(engine);

      const now = getTime();
      // start from 0 to 1
      transport.start(now);
      transport.pause(now + 1);
      // start from 1 to 2
      transport.start(now + 2);
      // start seek at 10 while continue starting
      transport.seek(now + 3, 10);
      transport.stop(now + 4);

      await delay(5000);
    });

    it(`start at 0, loop between 1 and 2`, async function() {
      this.timeout(6000);

      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      // make sure transport event are always triggered before "regular" scheduler ticks
      let transportEventTime = Infinity;
      let transportEventPosition = Infinity;
      let tickTime = -Infinity;

      const engine = (position, time, event) => {
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
      transport.add(engine);

      const now = getTime();
      transport.loopStart(now, 1);
      transport.loopEnd(now, 2);
      transport.loop(now, true);
      transport.start(now);

      await delay(5000);

      transport.remove(engine);
      transport.pause(getTime());
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

          // both master and slave engine should be called before the second start (at 2s)
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
      const engine1 = new Engine('master');
      master.add(engine1.tick)
      master.start(getTime()); // don't know how to handle that yet

      // second 1 - slave starts
      await delay(1000);
      const slave = new Transport(scheduler, master.dumpState());
      const engine2 = new Engine('slave');
      slave.add(engine2.tick);

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
