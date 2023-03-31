import { assert } from 'chai';

import { Scheduler } from 'waves-masters';
import Transport from '../src/Transport.js';

describe(`Transport`, () => {
  it(`should work`, function() {
    this.timeout(6 * 1000);
    return new Promise(resolve => {

      const startTime = Date.now() / 1000;
      const scheduler = new Scheduler(() => (Date.now() / 1000) - startTime);

      const transport = new Transport(scheduler);

      const expectedEvents = [
        { type: 'play', position: 0, time: 1 },
        { type: 'seek', position: 23.5, time: 2 },
        { type: 'pause', position: 24.5, time: 3 },
        { type: 'seek', position: 0, time: 3 },
        { type: 'play', position: 0, time: 5 }, // this one wont be precise
      ];

      let index = 0;

      const player = {
        onScheduledEvent(event, position, time, dt) {
          const expected = expectedEvents[index];
          assert.equal(event.type, expected.type);
          assert.equal(event.position, expected.position);
          assert.isBelow(Math.abs(event.time - expected.time), 0.01);

          console.log(`type: ${event.type} - position: ${position} - time: ${time}`);

          index += 1;


          if (index === expectedEvents.length) {
            resolve();
          }
        },
      };

      transport.add(player);

      transport.play(1);
      transport.seek(2, 23.5); // seek at position 23.5
      // stop and seek to zero
      transport.pause(3);
      transport.seek(3, 0);

      setTimeout(() => {
        transport.play(Date.now() / 1000 - startTime + 1);
      }, 4 * 1000);
    });
  });
});
