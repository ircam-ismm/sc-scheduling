import { assert } from 'chai';
import { getTime } from '@ircam/sc-gettime';
import { sleep } from '@ircam/sc-utils';

import Scheduler from '../src/Scheduler.js';
import { kSchedulerCompatMode } from '../src/Scheduler.js';
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

// check Scheduler backward compatibility with waves TimeEngine API

describe('# Scheduler (compat mode)', () => {
  describe('.add(engine, time)', () => {
    it(`should throw if engine is added twice`, () => {
      const scheduler = new Scheduler(getTime);
      const engine = { advanceTime: () => {}};
      // define time in future so that engine is kept in scheduler
      // note: if delay is < lookahead tick is called synchronously
      scheduler.add(engine, 0.2);
      shouldThrow(() => scheduler.add(engine, 0.2));
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
          assert.equal(currentTime, quantize(time));

          time += 0.1;

          return currentTime + 0.1;
        }
      };

      scheduler.add(engine, time);
      await sleep(0.7);
      scheduler.remove(engine);
      // clean both entries from scheduler and priority queue
      // console.log(Object.getOwnPropertySymbols(engine[kSchedulerCompatMode]));
      assert.equal(Object.getOwnPropertySymbols(engine[kSchedulerCompatMode]).length, 0);
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
          assert.equal(currentTime, quantize(time));

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
    // this doesn't work in compat mode
    it(`should clear and stop scheduler`, async () => {
      const scheduler = new Scheduler(getTime);
      let time;
      let counter = 0;
      const engine = {
        advanceTime: (currentTime, audioTime, dt) => {
          console.log(currentTime);
          assert.equal(currentTime, quantize(time));

          time += 0.1;
          return currentTime + 0.1; // engine is not removed from scheduler
        }
      };

      time = getTime();
      scheduler.add(engine, time);
      await sleep(0.5);
      scheduler.clear();

      // check the schedulerInstance is clean
      assert.equal(Object.getOwnPropertySymbols(engine[kSchedulerCompatMode]).length, 0);

      // make sure we can add the engine back to the scheduler
      scheduler.add(engine, time + 1);
      scheduler.clear();
    });
  });

  describe('has(engine)', () => {
    it(`should check if engine already in scheduler`, () => {
      const scheduler = new Scheduler(getTime);
      const engineA = {
        advanceTime: () => {},
      };
      const engineB = {
        advanceTime: () => {},
      };

      // add at Infinity so the engine is not removed synchronously
      // (advanceTime returns a NaN value)
      scheduler.add(engineA, Infinity);
      assert.equal(scheduler.has(engineA), true);
      assert.equal(scheduler.has(engineB), false);
    });
  });

  describe('make sure we can have several of them in parallell', () => {
    it(`should check if engine already in scheduler`, async function() {
      this.timeout(5000);

      const scheduler = new Scheduler(getTime);
      const engineA = {
        advanceTime: (currentTime) => {
          console.log('engine A', currentTime);
          return currentTime + 0.5;
        },
      };
      const engineB = {
        advanceTime: (currentTime) => {
          console.log('engine B', currentTime);
          return currentTime + 1;
        },
      };

      // add at Infinity so the engine is not removed synchronously
      // (advanceTime returns a NaN value)
      const now = getTime()
      scheduler.add(engineA, now);
      scheduler.add(engineB, now);
      // assert.equal(scheduler.has(engineA), true);
      // assert.equal(scheduler.has(engineB), false);
      await sleep(4)
      scheduler.clear();
    });
  });
});

