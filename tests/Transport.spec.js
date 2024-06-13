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

  describe('## play(time)', () => {
    it('should throw if argument 1 is not a positive number', () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.play());
      assert.throws(() => transport.play({}));
      assert.throws(() => transport.play(null));
      assert.throws(() => transport.play(-1));
      transport.play(0);
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
    it.skip(`should throw if value is not a positive number`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loopStart = -1);
      assert.throws(() => transport.loopStart = null);

      transport.loopStart = 0;
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

  describe.skip('## loopEnd(time, position)', () => {
    it(`should throw if value is not a positive number`, () => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      assert.throws(() => transport.loopEnd = -1);
      assert.throws(() => transport.loopEnd = null);

      transport.loopEnd = 1;
    });

    it(`should throw if given value is lower than or equal to loopStart`, () => {
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

  describe.only('## Behaviour', () => {
    it(`[TransportEvents] play at 0, seek at 23.5, pause at 24.5, seek at 0, play`, async function() {
      this.timeout(6 * 1000);

      return new Promise(resolve => {
        const scheduler = new Scheduler(() => getTime());
        const transport = new Transport(scheduler);

        const now = getTime();

        const expectedEvents = [
          { type: 'play', position: 0, speed: 1, time: now + 1 },
          { type: 'seek', position: 23.5, speed: 1, time: now + 2 },
          { type: 'pause', position: 24.5, speed: 0, time: now + 3 },
          { type: 'seek', position: 0, speed: 0, time: now + 3 },
          // this one wont be precise because of the of the setTimeout
          { type: 'play', position: 0, speed: 1, time: now + 4 },
        ];

        let index = 0;

        const engine = (position, time, event) => {
          console.log('[TransportEvent]', event);
          const expected = expectedEvents[index];
          assert.equal(event.type, expected.type);
          assert.equal(event.position, expected.position);
          assert.equal(event.speed, expected.speed);

          // The last 'play' event wont be very precise because of the `setTimeout`
          if (index < 4) {
            assert.isBelow(Math.abs(event.time - expected.time), 1e-9);
          } else {
            assert.isBelow(Math.abs(event.time - expected.time), 0.005);
          }

          index += 1;

          if (index === expectedEvents.length) {
            resolve();
          }
        };

        transport.add(engine);
        // Support
        transport.play(now + 1);
        transport.seek(now + 2, 23.5); // seek at position 23.5
        // stop and seek to zero
        transport.pause(now + 3);
        transport.seek(now + 3, 0);

        setTimeout(() => {
          transport.play(getTime());
        }, 4 * 1000);
      });
    });


    it(`should properly call engine with generic scheduler events -
            play from 0 to 1, pause 1sec, play from 1 to 2, seek to 10, play from 10 to 11, pause `, async function() {
      this.timeout(8000);

      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      const engine = (position, time, infos) => {
        if (infos instanceof TransportEvent) {
          console.log('[TransportEvent]', position, time, infos);
          console.log('[TransportEvent] return', infos.speed > 0 ? position : Infinity);
          return infos.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position, time, infos);
        return position + 0.1;
      };

      transport.add(engine);

      const now = getTime();
      // play from 0 to 1
      transport.play(now);
      transport.pause(now + 1);
      // play from 1 to 2
      transport.play(now + 2);
      // play seek at 10 while continue playing
      transport.seek(now + 3, 10);
      transport.pause(now + 4);

      await new Promise(resolve => setTimeout(resolve, 5000));
    });

    it.only(`start at 0, loop between 1 and 2`, async function() {
      this.timeout(8000);

      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      const engine = (position, time, infos) => {
        if (infos instanceof TransportEvent) {
          console.log('[TransportEvent]', position, '\t', time, infos);
          console.log('[TransportEvent] return', infos.speed > 0 ? position : Infinity);
          return infos.speed > 0 ? position : Infinity;
        }

        console.log('[Scheduler tick]', position, '\t', time);
        return position + 0.1;
      };

      // play from 0 to 2, then loop between 1 and 2
      transport.add(engine);

      const now = getTime();
      transport.loopStart(now, 1);
      transport.loopEnd(now, 2);
      transport.loop(now, true);
      transport.play(now);

      await delay(5000);

      transport.remove(engine);
    });
  });

  // ## TODOS
  //
  // - [ ] add(engine)
       // what happens if transport is started?
  // - [ ] has(engine)
  // - [ ] remove(engine)

  // - [ ] loop
  // - [ ] speed
  // - [ ] cancel

  // - [ ] controls / addEvent -> slave one transport to another one
  // - [ ] getState / setState -> slave one transport to an existing one
  // - [ ] addEvent -> remote control

  // - [ ] engine respond to TransportEvent in the past
  //
});
