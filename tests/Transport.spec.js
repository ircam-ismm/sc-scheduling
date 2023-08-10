import { assert } from 'chai';
import { getTime } from '@ircam/sc-gettime';

import Transport from '../src/Transport.js';
import Scheduler from '../src/Scheduler.js';

describe(`# Transport`, () => {
  it(`play / pause / seek - engine.onTransportEvent`, async function() {
    this.timeout(6 * 1000);

    return new Promise(resolve => {
      const scheduler = new Scheduler(getTime);
      const transport = new Transport(scheduler);

      const now = getTime();

      const expectedEvents = [
        { type: 'play', position: 0, time: now + 1 },
        { type: 'seek', position: 23.5, time: now + 2 },
        { type: 'pause', position: 24.5, time: now + 3 },
        { type: 'seek', position: 0, time: now + 3 },
        // this one wont be precise because of the of the setTimeout
        { type: 'play', position: 0, time: now + 4 },
      ];

      let index = 0;

      const engine = {
        onTransportEvent(event, position, time, dt) {
          console.log('child::onTransportEvent', event.type);
          const expected = expectedEvents[index];
          assert.equal(event.type, expected.type);
          assert.equal(event.position, expected.position);
          // this one wont be precise because of the of the setTimeout
          assert.isBelow(Math.abs(event.time - expected.time), 0.01);

          // console.log(`type: ${event.type} - position: ${position} - time: ${time} (expected: ${expected.time})`);

          index += 1;


          if (index === expectedEvents.length) {
            resolve();
          }
        },
      };

      transport.add(engine);

      transport.play(now + 1);
      transport.seek(now + 2, 23.5); // seek at position 23.5
      // stop and seek to zero
      transport.pause(now + 3);
      transport.seek(now + 3, 0);

      setTimeout(() => {
        transport.play(getTime());
      }, 4 * 1000);

      // await new Promise(resolve => setTimeout(resolve, 500));
    });
  });

  it(`should properly call engine.advanceTime method`, async function() {
    this.timeout(8000);

    const scheduler = new Scheduler(getTime);
    const transport = new Transport(scheduler);

    const engine = {
      onTransportEvent(event, position, audioTime, dt) {
        console.log('+ Child::onTransportEvent:', event, position, audioTime, dt);
        return event.speed > 0 ? position : Infinity;
      },
      advanceTime(position, audioTime, dt) {
        console.log('+ Child::advanceTime:', position, audioTime, dt);
        return position + 0.1;
      },
    };

    transport.add(engine);

    const now = getTime();
    transport.play(now);
    transport.pause(now + 1);
    transport.play(now + 2);
    transport.seek(now + 3, 10);
    transport.pause(now + 4);

    await new Promise(resolve => setTimeout(resolve, 5000));
  });
});
