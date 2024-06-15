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
  describe('## constructor(getTimeFunction, options)', () => {
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

    it(`option.currentTimeToProcessorTimeFunction`, () => {
      const scheduler = new Scheduler(getTime, {
        currentTimeToProcessorTimeFunction: currentTime => currentTime + 1,
      });

      const processor = (currentTime, processorTime) => {
        assert.equal(currentTime + 1, processorTime);
      };

      scheduler.add(processor);
    })
  });

  describe('## period', () => {
    it(`should throw if < 0`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.period = -2);
    })

    it(`should throw if >= lookahead`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.period = scheduler.lookahead);
    })
  });

  describe('## lookahead', () => {
    it(`should throw if < 0`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.lookahead = -2);
    })

    it(`should throw if >= lookahead`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.lookahead = scheduler.period);
    })
  });

  describe('## add(processor, time)', () => {
    it(`should throw if processor is not a function`, () => {
      const scheduler = new Scheduler(getTime);
      shouldThrow(() => scheduler.add({}));
    });

    it(`should throw if processor is added twice`, () => {
      const scheduler = new Scheduler(getTime);
      const processor = () => {};
      // define time in future so that processor is kept in scheduler
      // note: if delay is < lookahead tick is called synchronously
      scheduler.add(processor, 0.2);
      shouldThrow(() => scheduler.add(processor, 0.2));
    });

    it(`should start immediately: start time below lookahead and period`, async () => {
      const scheduler = new Scheduler(getTime);
      const startAt = getTime();
      const processor = (currentTime, audioTime, event) => {
        console.log('> dt should be negative ~1-2ms, i.e. timeout warm up):', event.tickLookahead);
        assert.equal(quantize(startAt), currentTime);
        assert.isBelow(event.tickLookahead, 0);
      };
      scheduler.add(processor, startAt);
      await sleep(0.1);
    });

    it(`should start immediately if no time given`, async () => {
      const scheduler = new Scheduler(getTime);
      const now = getTime();
      const processor = (currentTime, audioTime, event) => {
        console.log('> dt should be negative ~1-2ms, i.e. timeout warm up):', event.tickLookahead);
        assert.isBelow(now - currentTime, 0.01);
        assert.isBelow(event.tickLookahead, 0); // 0.02ms (~sample duration)
      };
      scheduler.add(processor);
      await sleep(0.1);
    });

    it(`should start in future with given time`, async () => {
      const scheduler = new Scheduler(getTime);
      const startAt = getTime() +  0.1;
      const processor = (currentTime, audioTime, event) => {
        console.log('> dt (should be ~0.1, i.e.lookahead):', event.tickLookahead);
        assert.equal(quantize(startAt), currentTime);
        assert.isAbove(event.tickLookahead, 0.09); // 0.02ms (~sample duration)
      };

      scheduler.add(processor, startAt);
      await sleep(0.1);
    });

    it(`processor should be called back if processor returns value`, async () => {
      const scheduler = new Scheduler(getTime);
      let time = getTime() +  0.1;
      let counter = 0;
      const processor = (currentTime, audioTime, event) => {
        console.log(currentTime);
        assert.equal(quantize(time), currentTime);

        time += 0.1;

        if (++counter >= 5) {
          return; // stop processor
        }

        return currentTime + 0.1;
      };

      scheduler.add(processor, time);

      await sleep(0.7);
    });
  });

  describe(`## remove(processor)`, () => {
    it(`should stop processor`, async () => {
      const scheduler = new Scheduler(getTime);
      let time = getTime() +  0.1;
      let counter = 0;
      const processor = (currentTime, audioTime, event) => {
        console.log(currentTime);
        assert.equal(quantize(time), currentTime);

        time += 0.1;

        return currentTime + 0.1;
      };

      scheduler.add(processor, time);
      await sleep(0.7);
      scheduler.remove(processor);

      // clean both entries from scheduler and priority queue
      console.log(Object.getOwnPropertySymbols(processor));
      assert.equal(Object.getOwnPropertySymbols(processor).length, 0);
    });
  });

  describe(`## reset(processor, time)`, () => {
    it(`should reset processor`, async () => {
      const scheduler = new Scheduler(getTime);
      let time;
      let counter = 0;
      const processor = (currentTime, audioTime, event) => {
        console.log(currentTime);
        assert.equal(quantize(time), currentTime);

        return Infinity; // processor is not removed from scheduler
      };

      time = getTime();
      scheduler.add(processor, time);
      await sleep(0.5);

      time += 1;
      scheduler.reset(processor, time);
      await sleep(0.5);
    });
  });

  describe(`## clear()`, () => {
    // this doesn't work in compat mode
    it(`should clear and stop scheduler`, async () => {
      const scheduler = new Scheduler(getTime);
      let time;
      let counter = 0;
      const processor = (currentTime, audioTime, event) => {
        console.log(currentTime);
        assert.equal(quantize(time), currentTime);

        time += 0.1;
        return currentTime + 0.1; // processor is not removed from scheduler
      };

      time = getTime();
      scheduler.add(processor, time);
      await sleep(0.5);
      scheduler.clear();

      // check the schedulerInstance is clean
      assert.equal(Object.getOwnPropertySymbols(processor).length, 0);
      // should not throw
      scheduler.add(processor, time + 1);
      scheduler.clear();
    });
  });

  describe(`## defer(callback, time)`, () => {
    it(`should compensate for tickLookahead`, async () => {
      const scheduler = new Scheduler(getTime);
      let counter = 1;
      const processor = (currentTime, audioTime, event) => {
        console.log('executed at', getTime());
        console.log(currentTime, audioTime, event);
      }

      const time = getTime() + 0.1;
      console.log('scheduled at', time);
      scheduler.defer(processor, time);

      await sleep(0.2);
    });

    it(`defer within processor example should work`, async () => {
      const scheduler = new Scheduler(getTime);

      const defered = (currentTime, audioTime, event) => {
        console.log('defered', currentTime, event.tickLookahead);
      }

      scheduler.add((currentTime, audioTime, event) => {
        console.log('tick', currentTime, event.tickLookahead);
        scheduler.defer(defered, currentTime);

        return currentTime + 0.2; // don't fall into lookahead for clarity of logs
      });

      await sleep(1);

      scheduler.clear();
    });
  });

  describe('## Behaviour', () => {
    it(`start()`, async () => {
      const scheduler = new Scheduler(getTime, { verbose: true });
      let time;
      let hasStarted = false;

      const processor = (currentTime, audioTime, event) => {
        console.log('> currentTime:', currentTime);
        assert.equal(quantize(time), currentTime);
        hasStarted = true;
        // processor is not removed from scheduler, but scheduler should stop
        return Infinity;
      };

      time = getTime();
      scheduler.add(processor, time);
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
    it(`remove() - regression test`, async function() {
      const scheduler = new Scheduler(getTime, {
        lookahead: 2,
        period: 1,
        // verbose: true,
      });

      // add at 0.
      let called = false;
      const processorBg = (currentTime, audioTime, event) => {
        console.log('- bg', getTime(), currentTime, event.tickLookahead);
        return currentTime + 2.2; //
      };
      const processorA = (currentTime, audioTime, event) => {
        console.log('- a', getTime(), currentTime, event.tickLookahead);
        return Infinity;
      };
      const processorB = (currentTime, audioTime, event) => {
        console.log('- b (should not be executed)', getTime(), currentTime, event.tickLookahead);
        return Infinity;
      };

      let time = getTime(); // time 0
      console.log('> start at', time);
      scheduler.add(processorBg, time);
      scheduler.add(processorA, Infinity); //
      scheduler.add(processorB, Infinity); //

      await sleep(0.5);

      scheduler.reset(processorB, time + 0.9);
      scheduler.reset(processorA, time + 0.8);
      scheduler.remove(processorB);

      await sleep(0.5);

      scheduler.clear();
    });

    it(`maxRecursions: discard processor if limit is reached`, async () => {
      const scheduler = new Scheduler(getTime);
      let counter = 0;

      const processor = (currentTime, audioTime, event) => {
        counter += 1;
        return currentTime; // should stop after 100 iterations
      };

      scheduler.add(processor, getTime());
      await sleep(0.1);
      assert.equal(counter, 100);
    });

    it(`maxRecursions: make sure the normal case is working`, async () => {
      const scheduler = new Scheduler(getTime);
      let counter = 0;
      const processor = (currentTime, audioTime, event) => {
          counter += 1;
          if (counter === 150) {
            return;
          }
          return currentTime + 0.0001;
      };

      scheduler.add(processor, getTime());
      await sleep(0.1);
      assert.equal(counter, 150);
    });

    it(`gracefully discard faulty engine`, async () => {
      const scheduler = new Scheduler(getTime);

      const processor1 = () => {
        throw Error('faulty engine');
      };

      let counter = 0;
      const processor2 = (currentTime, audioTime, event) => {
          counter += 1;
          return counter > 10 ? null : currentTime + 0.01;
      };

      scheduler.add(processor1);
      scheduler.add(processor2);

      await sleep(0.1);
      // make sure processor 2 continued running
      assert.isAbove(counter, 9);
    });
  });
});
