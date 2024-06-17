import { render, html } from 'lit/html.js';
import { getTime } from '@ircam/sc-gettime';

import '@ircam/sc-components/sc-clock.js';
import '@ircam/sc-components/sc-number.js';
import '@ircam/sc-components/sc-text.js';
import '@ircam/sc-components/sc-toggle.js';
import '@ircam/sc-components/sc-transport.js';

import Scheduler from '../../../src/Scheduler.js';
import Transport from '../../../src/Transport.js';
import TransportEvent from '../../../src/TransportEvent.js';

console.info('> self.crossOriginIsolated', self.crossOriginIsolated);

const scheduler = new Scheduler(getTime);
const transport = new Transport(scheduler);

const processorPeriod = 0.5; // in seconds
const processor = (currentTime, processorTime, event) => {
  if (event instanceof TransportEvent) {
    return event.speed > 0 ? currentTime : Infinity;
  }

  // compensate for scheduler lookahead (cf. event.tickLookahead)
  scheduler.defer(() => {
    const $feedback = document.querySelector('#processor-feedback');
    $feedback.value = processorTime;
  }, currentTime);

  return currentTime + processorPeriod;
};

render(html`
  <h2>simple transport</h2>
  <sc-transport
    .buttons=${['start', 'pause', 'stop']}
    value="stop"
    @change=${e => transport[e.detail.value](getTime())}
  ></sc-transport>
  <div style="margin: 4px 0;">
    <sc-text>seek</sc-text>
    <sc-number
      min="0"
      value="0"
      @change=${e => transport.seek(getTime(), e.detail.value)}
    ></sc-number>
  </div>
  <div style="margin: 4px 0;">
    <sc-text>loopStart</sc-text>
    <sc-number
      min="0"
      value="0"
      @change=${e => transport.loopStart(getTime(), e.detail.value)}
    ></sc-number>
  </div>
  <div style="margin: 4px 0;">
    <sc-text>loopEnd</sc-text>
    <sc-number
      min="0"
      value="0"
      @change=${e => transport.loopEnd(getTime(), e.detail.value)}
    ></sc-number>
  </div>
  <div style="margin: 4px 0;">
    <sc-text>loop</sc-text>
    <sc-toggle
      @change=${e => transport.loop(getTime(), e.detail.value)}
    ></sc-toggle>
  </div>
  <div style="margin: 4px 0;">
    <sc-text style="width: 400px">Add / remove processor (tick every 500ms)</sc-text>
    <sc-toggle
      @change=${e => e.detail.value ? transport.add(processor) : transport.remove(processor)}
    ></sc-toggle>
    <sc-text id="processor-feedback"></sc-text>
  </div>

  <!-- note that this does not work properly with spedd for now -->
  <div style="margin: 4px 0;">
    <sc-text>speed <i>[experimental]</i></sc-text>
    <sc-number
      min="0.1"
      max="5"
      value="1"
      @change=${e => transport.speed(getTime(), e.detail.value)}
    ></sc-number>
  </div>

  <div style="margin: 16px 0;">
    <sc-clock
      style="font-size: 20px; height: 60px; width: 500px;"
      .getTimeFunction=${() => transport.getPositionAtTime(getTime())}
      twinkle
    ></sc-clock>
  </div>
`, document.body);
