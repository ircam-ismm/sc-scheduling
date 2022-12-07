import { assert } from 'chai';

import { Scheduler } from 'waves-masters';
import Transport from '../src/Transport.js';


const startTime = Date.now() / 1000;
const scheduler = new Scheduler(() => (Date.now() / 1000) - startTime);

const transport = new Transport(scheduler);

const player = {
  onScheduledEvent(event, position, audioTime, dt) {
    console.log(event.type, position, audioTime, dt);
  },
};

transport.add(player);

transport.play(1);
transport.seek(2, 23.5); // seek at position 23.5
// stop and seek to zero
transport.pause(3);
transport.seek(3, 0);


setTimeout(() => {
  console.log('restart');
  transport.play(Date.now() / 1000 - startTime + 1);
  // scheduler.remove(transport);
  // // scheduler.remove(player);
}, 4 * 1000);
