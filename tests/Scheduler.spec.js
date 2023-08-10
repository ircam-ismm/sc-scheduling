import { assert } from 'chai';
import { getTime } from '@ircam/sc-gettime';
import { sleep } from '@ircam/sc-utils';

import Scheduler from '../src/Scheduler.js';
import { quantize } from '../src/utils.js';

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
  describe('## API', () => {
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
      it(`should throw if engine is not a function`, () => {
        const scheduler = new Scheduler(getTime);
        shouldThrow(() => scheduler.add({}));
      });


      it(`should throw if invalid time given`, () => {
        const scheduler = new Scheduler(getTime);
        const engine = () => {};
        shouldThrow(() => scheduler.add(engine));
      });

      it(`should throw if engine is added twice`, () => {
        const scheduler = new Scheduler(getTime);
        const engine = () => {};
        // define time in future so that engine is kept in scheduler
        // note: if delay is < lookahead tick is called synchronously
        scheduler.add(engine, 0.2);
        shouldThrow(() => scheduler.add(engine, 0.2));
      });

      it(`should start immediately if needed`, async () => {
        const scheduler = new Scheduler(getTime);
        const startAt = getTime() + 1e-12;
        const engine = (currentTime, audioTime, dt) => {
          assert.equal(quantize(startAt), currentTime);
          console.log('> dt is negative, i.e. we are late ~1-2ms):', dt);
          assert.isBelow(dt, 2e-5); // 0.02ms (~sample duration)
        };
        scheduler.add(engine, startAt);
        // await sleep(0.1);
      });

      it(`should start in future with given time`, () => {
        const scheduler = new Scheduler(getTime);
        const startAt = getTime() +  0.1;
        const engine = (currentTime, audioTime, dt) => {
          assert.equal(quantize(startAt), currentTime);
          console.log('> dt (should be ~0.1, i.e.lookahead):', dt);
        };

        scheduler.add(engine, startAt);
      });

      it(`should start loop if engine returns value`, async () => {
        const scheduler = new Scheduler(getTime);
        let time = getTime() +  0.1;
        let counter = 0;
        const engine = (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(quantize(time), currentTime);

          time += 0.1;

          if (++counter >= 5) {
            return; // stop engine
          }

          return currentTime + 0.1;
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
        const engine = (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(quantize(time), currentTime);

          time += 0.1;

          return currentTime + 0.1;
        };

        scheduler.add(engine, time);
        await sleep(0.7);
        scheduler.remove(engine);

        // clean both entries from scheduler and priority queue
        console.log(Object.getOwnPropertySymbols(engine));
        assert.equal(Object.getOwnPropertySymbols(engine).length, 0);
      });
    });

    describe(`reset(engine, time)`, () => {
      it(`should reset engine`, async () => {
        const scheduler = new Scheduler(getTime);
        let time;
        let counter = 0;
        const engine = (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(quantize(time), currentTime);

          return Infinity; // engine is not removed from scheduler
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
      // this doesn't work in compat mode
      it(`should clear and stop scheduler`, async () => {
        const scheduler = new Scheduler(getTime);
        let time;
        let counter = 0;
        const engine = (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(quantize(time), currentTime);

          time += 0.1;
          return currentTime + 0.1; // engine is not removed from scheduler
        };

        time = getTime();
        scheduler.add(engine, time);
        await sleep(0.5);
        scheduler.clear();

        // check the schedulerInstance is clean
        assert.equal(Object.getOwnPropertySymbols(engine).length, 0);
        // should not throw
        scheduler.add(engine, time + 1);
        scheduler.clear();
      });
    });
  });

  describe('## MISC', () => {
    describe(`start / stop scheduler`, () => {
      it(`start`, async () => {
        const scheduler = new Scheduler(getTime, { verbose: true });
        let time;
        let hasStarted = false;

        const engine = (currentTime, audioTime, dt) => {
          console.log('> currentTime:', currentTime);
          assert.equal(quantize(time), currentTime);
          hasStarted = true;
          // engine is not removed from scheduler, but scheduler should stop
          return Infinity;
        };

        time = getTime();
        scheduler.add(engine, time);
        await sleep(0.1);

        assert.equal(hasStarted, true);
      });

      // remove() - Fixed failing case:
      // - next tick is at 1 (last was at 0), period is 1, lookahead is 2,  _nextTime is at 2.2
      // - at time 0.5:
      //   1. move b to 0.9 -> this reschedule the tick at 0.5 (minimum bound is 0)
      //   2. move a to 0.8 -> this reschedule the tick at 0.5 (minimum bound is 0)
      //   3. remove a -> currently reschedules the tick at 1.5 (minimum bound is period)
      //               -> should be rescheduled at 0.5
      //
      // we should see now something like
      // > we start at 0.005363428
      // - bg 0.005922205000000001 0.005363428 -0.000531531 (sync scheduler call)
      // - a 0.510554994 0.805363428 0.294909145
      // - bg 0.510846543 2.205363428 1.694909145
      it(`remove - regression test`, async function() {
        const scheduler = new Scheduler(getTime, {
          lookahead: 2,
          period: 1,
          // verbose: true,
        });

        // add at 0.
        let called = false;
        const engineBg = (currentTime, audioTime, dt) => {
          console.log('- bg', getTime(), currentTime, dt);
          return currentTime + 2.2; //
        };
        const engineA = (currentTime, audioTime, dt) => {
          console.log('- a', getTime(), currentTime, dt);
          return Infinity;
        };
        const engineB = (currentTime, audioTime, dt) => {
          console.log('- b (should not be executed)', getTime(), currentTime, dt);
          return Infinity;
        };

        let time = getTime(); // time 0
        console.log('> start at', time);
        scheduler.add(engineBg, time);
        scheduler.add(engineA, Infinity); //
        scheduler.add(engineB, Infinity); //

        await sleep(0.5);

        scheduler.reset(engineB, time + 0.9);
        scheduler.reset(engineA, time + 0.8);
        scheduler.remove(engineB);

        await sleep(0.5);

        scheduler.clear();
      });
    });

    describe(`prevent infinite loops`, () => {
      it(`discard engine if maxEngineRecursion is reached`, async () => {
        const scheduler = new Scheduler(getTime);
        let counter = 0;

        const engine = (currentTime, audioTime, dt) => {
          counter += 1;
          return currentTime; // should stop after 100 iterations
        };

        scheduler.add(engine, getTime());
        await sleep(0.1);
        assert.equal(counter, 100);
      });

      it(`make sure the normal case is working`, async () => {
        const scheduler = new Scheduler(getTime);
        let counter = 0;
        const engine = (currentTime, audioTime, dt) => {
            counter += 1;
            if (counter === 150) {
              return;
            }
            return currentTime + 0.0001;
        };

        scheduler.add(engine, getTime());
        await sleep(0.1);
        assert.equal(counter, 150);
      });
    });
  });
});
