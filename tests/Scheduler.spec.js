import { assert } from 'chai';
import { getTime } from '@ircam/sc-gettime';

import Scheduler from '../src/Scheduler.js';

describe('# Scheduler', () => {
  it(`should keep engine with scheduled to Infinity`, async function() {
    this.timeout(5000);

    const scheduler = new Scheduler(getTime);

    const engine = {
      advanceTime(currentTime, audioTime, dt) {
        console.log(currentTime, audioTime, dt);
        return Infinity;
      }
    }

    scheduler.add(engine);

    await new Promise(resolve => setTimeout(resolve, 100));

    scheduler.resetEngineTime(engine, getTime());
  });
});
