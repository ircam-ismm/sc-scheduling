import { assert } from 'chai';
import { getTime } from '@ircam/sc-gettime';
import { sleep } from '@ircam/sc-utils';

import Scheduler from '../src/Scheduler.js';
import { schedulerKey } from '../src/utils.js';

function shouldThrow(test) {
  let failed = false;
  try {
    test();
  } catch (err) {
    console.log(err.message);
    failed = true;
  }

  if (!failed) {
    assert.fail('should have thrown');
  }
}

describe('# Scheduler', () => {
  describe('.constructor(getTimeFunction, options)', () => {
    it(`should throw if getTimeFunction is not a function`, () => {
      shouldThrow(() => new Scheduler());
    });

    it(`should work with default options`, () => {
      const scheduler = new Scheduler(getTime);
      assert.equal(scheduler instanceof Scheduler, true);
      assert.equal(scheduler.period, 0.025);
      assert.equal(scheduler.lookahead, 0.1);
    });

    it(`configure lookahead and period`, () => {
      const scheduler = new Scheduler(getTime, {
        period: 0.05,
        lookahead: 0.2,
      });

      assert.equal(scheduler.period, 0.05);
      assert.equal(scheduler.lookahead, 0.2);
    });
  });

  describe('.period', () => {
    it(`should throw if < 0`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.period = -2);
    })

    it(`should throw if >= lookahead`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.period = scheduler.lookahead);
    })
  });

  describe('.lookahead', () => {
    it(`should throw if < 0`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.lookahead = -2);
    })

    it(`should throw if >= lookahead`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.lookahead = scheduler.period);
    })
  });

  describe('.add(engine, time)', () => {
    it(`should throw if engine does not implement advanceTime`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.add({}));
    });


    it(`should throw if invalid time given`, () => {
      const scheduler = new Scheduler(getTime);
      const engine = { advanceTime: () => {}};
      shouldThrow(() => scheduler.add(engine));
    });

    it(`should throw if engine is added twice`, () => {
      const scheduler = new Scheduler(getTime);
      const engine = { advanceTime: () => {}};
      // define time in future so that engine is kept in scheduler
      // note: if delay is < lookahead tick is called synchronously
      scheduler.add(engine, 0.2);
      shouldThrow(() => scheduler.add(engine, 0.2));
    });

    it(`should start immediately (no timeout) if needed`, () => {
      const scheduler = new Scheduler(getTime);
      const startAt = getTime();
      const engine = {
        advanceTime: (currentTime, audioTime, dt) => {
          assert.equal(startAt, currentTime);
          console.log('> dt (should be negative be very small):', dt);
          assert.isBelow(dt, 2e-5); // 0.02ms (~sample duration)
        },
      };
      scheduler.add(engine, startAt);
    });

    it(`should start in future with given time`, () => {
      const scheduler = new Scheduler(getTime);
      const startAt = getTime() +  0.1;
      const engine = {
        advanceTime: (currentTime, audioTime, dt) => {
          assert.equal(startAt, currentTime);
          console.log('> dt (should be ~0.1, i.e.lookahead):', dt);
        },
      };

      scheduler.add(engine, startAt);
    });

    it(`should start loop if engine returns value`, async () => {
      const scheduler = new Scheduler(getTime);
      let time = getTime() +  0.1;
      let counter = 0;
      const engine = {
        advanceTime: (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(currentTime, time);

          time += 0.1;

          if (++counter >= 5) {
            return; // stop engine
          }

          return currentTime + 0.1;
        }
      };

      scheduler.add(engine, time);

      await sleep(0.7);
    });
  });

  describe(`remove(engine)`, () => {
    it(`should stop engine`, async () => {
      const scheduler = new Scheduler(getTime);
      let time = getTime() +  0.1;
      let counter = 0;
      const engine = {
        advanceTime: (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(currentTime, time);

          time += 0.1;

          return currentTime + 0.1;
        }
      };

      scheduler.add(engine, time);
      await sleep(0.7);
      scheduler.remove(engine);

      // clean both entries from scheduler and priority queue
      assert.equal(Object.getOwnPropertySymbols(engine).length, 0);
    });
  });

  describe(`reset(engine, time)`, () => {
    it(`should reset engine`, async () => {
      const scheduler = new Scheduler(getTime);
      let time;
      let counter = 0;
      const engine = {
        advanceTime: (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(currentTime, time);

          return Infinity; // engine is not removed from scheduler
        }
      };

      time = getTime();
      scheduler.add(engine, time);
      await sleep(0.5);

      time += 1;
      scheduler.reset(engine, time);
      await sleep(0.5);
    });
  });

  describe(`clear()`, () => {
    it.only(`should clear and stop scheduler`, async () => {
      const scheduler = new Scheduler(getTime);
      let time;
      let counter = 0;
      const engine = {
        advanceTime: (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(currentTime, time);

          time += 0.1;
          return currentTime + 0.1; // engine is not removed from scheduler
        }
      };

      time = getTime();
      scheduler.add(engine, time);
      await sleep(0.5);
      scheduler.clear();
      assert.equal(Object.getOwnPropertySymbols(engine).length, 0);
    });
  });

  describe(`## Engine.advanceTime(currentTime, audioTime, dt)`, () => {
    it(`returning Infinity`, async () => {
      const scheduler = new Scheduler(getTime);
      let time;
      let counter = 0;
      const engine = {
        advanceTime: (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(currentTime, time);

          return Infinity; // engine is not removed from scheduler
        }
      };

      time = getTime();
      scheduler.add(engine, time);
      await sleep(0.5);

      time += 1;
      scheduler.reset(engine, time);
      await sleep(0.5);
    });
  });

});
