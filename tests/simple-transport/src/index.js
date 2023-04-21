import "core-js/stable";
import "regenerator-runtime/runtime";
import { render, html } from 'lit/html.js';
import { resumeAudioContext } from '@ircam/resume-audio-context';
import { getTime } from '@ircam/sc-gettime';

import '@ircam/simple-components/sc-bang.js';
import '@ircam/simple-components/sc-transport.js';
import './sc-clock.js';

import Scheduler from '../../../src/Scheduler.js';
import Transport from '../../../src/Transport.js';

console.info('> self.crossOriginIsolated', self.crossOriginIsolated);

(async function main() {
  const scheduler = new Scheduler(getTime);
  const transport = new Transport(scheduler);;

  render(html`
    <h2>js-prototyping-template</h2>
    <sc-transport
      buttons="[play, pause, stop]"
      state="stop"
      @change="${e => {
        console.log(e.detail.value);
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
      }}"
    ></sc-transport>
    <sc-clock
      style="margin: 4px 0; display: block;"
      .getTimeFunction=${() => transport.getPositionAtTime(getTime())}
      font-size="20"
      twinkle="[0, 0.5]"
    ></sc-clock>
  `, document.body);
}());
