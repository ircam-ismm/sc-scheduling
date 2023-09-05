import { render, html } from 'lit/html.js';
import { getTime } from '@ircam/sc-gettime';

import '@ircam/sc-components/sc-clock.js';
import '@ircam/sc-components/sc-number.js';
import '@ircam/sc-components/sc-transport.js';

import Scheduler from '../../../src/Scheduler.js';
import Transport from '../../../src/Transport.js';

console.info('> self.crossOriginIsolated', self.crossOriginIsolated);

(async function main() {
  const scheduler = new Scheduler(getTime);
  const transport = new Transport(scheduler);;

  render(html`
    <h2>simple transport</h2>
    <sc-transport
      value="stop"
      @change=${e => {
        switch (e.detail.value) {
          case 'play':
            transport.play(getTime());
            break;
          case 'pause':
            transport.pause(getTime());
            break;
          case 'stop':
            transport.pause(getTime());
            transport.seek(getTime(), 0);
            break;
        }
      }}
    ></sc-transport>
    <sc-number
      min="0.1"
      max="5"
      value="1"
      @change=${e => transport.speed(getTime(), e.detail.value)}
    ></sc-number>

    <br />
    <br />

    <sc-clock
      style="font-size: 20px; height: 60px; width: 500px;"
      .getTimeFunction=${() => transport.getPositionAtTime(getTime())}
      twinkle
    ></sc-clock>
  `, document.body);
}());
