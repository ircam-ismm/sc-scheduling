import { assert } from 'chai';
import { getTime } from '@ircam/sc-gettime';
import { sleep } from '@ircam/sc-utils';

import Scheduler from '../src/Scheduler.js';
import { schedulerCompatMode } from '../src/utils.js';

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

describe('# Scheduler', () => {
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
          assert.equal(currentTime, time);

          time += 0.1;

          return currentTime + 0.1;
        }
      };

      scheduler.add(engine, time);
      await sleep(0.7);
      scheduler.remove(engine);
      // clean both entries from scheduler and priority queue
      // console.log(Object.getOwnPropertySymbols(engine[schedulerCompatMode]));
      assert.equal(Object.getOwnPropertySymbols(engine[schedulerCompatMode]).length, 0);
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
    // this doesn't work in compat mode
    it(`should clear and stop scheduler`, async () => {
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

      // check the schedulerInstance is clean
      assert.equal(Object.getOwnPropertySymbols(engine[schedulerCompatMode]).length, 0);
      // should not throw
      scheduler.add(engine, time + 1);
      scheduler.clear();
    });
  });
});

