import { AbstractExperience } from '@soundworks/core/client';
import { render, html, nothing } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import Transport from '../../../../../src/Transport.js';
import Scheduler from '../../../../../src/Scheduler.js';

import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-button.js';
import '@ircam/simple-components/sc-number.js';
import '@ircam/simple-components/sc-toggle.js';
import '@ircam/simple-components/sc-bang.js';
import '../lib/sc-clock.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.hasControls = window.location.hash === '#controller';

    this.sync = this.require('sync');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.transport = await this.client.stateManager.attach('transport');

    this.scheduler = new Scheduler(() => this.sync.getSyncTime());
    this.clock = new Transport(this.scheduler);
    this.clock.setState(this.transport.get('transportState'));

    this.preRoll = new Transport(this.scheduler);

    this.transport.subscribe(updates => {
      this.render();
      this.updateEngine(updates);
    }, true);

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  updateEngine(updates) {
    for (let [key, value] of Object.entries(updates)) {
      switch (key) {
        case 'clockEvents': {
          const clockEvents = value;

          if (clockEvents === null) {
            break;
          }

          clockEvents.map(event => this.clock.addEvent(event));

          if (updates.preRollEvents) {
            const preRollEvents = updates.preRollEvents;
            preRollEvents.map(event => this.preRoll.addEvent(event));
          }
          break;
        }
        case 'loopStart': {
          this.clock.loopStart = value;
          break;
        }
        case 'loopEnd': {
          this.clock.loopEnd = value;
          break;
        }
        // case 'loop': {
        //   this.clock.loop = value;
        //   break;
        // }
      }
    }
  }

  render() {
    const width = Math.min(window.innerWidth - 40, 614); // padding

    render(html`
      <div style="padding: 20px">
        <div>
          <sc-clock
            style="margin: 4px auto; display: block; width: ${width}px; /* this is needed for centering */"
            .getTimeFunction="${() => {
              const now = this.sync.getSyncTime();
              return this.preRoll.getPositionAtTime(now);
            }}"
            font-size="20"
            twinkle="[0, 0.5]"
            width="${width}"
          ></sc-clock>
          <sc-clock
            style="margin: 4px auto; display: block; width: ${width}px; /* this is needed for centering */"
            .getTimeFunction="${() => {
              const now = this.sync.getSyncTime();
              return this.clock.getPositionAtTime(now);
            }}"
            font-size="20"
            twinkle="[0.5, 1]"
            width="${width}"
          ></sc-clock>
        </div>

        ${this.hasControls ?
          html`
            <div style="width: ${width}px; margin: 50px auto 0;">
              <div style="padding: 4px 0;">
                <sc-button
                  style="margin-bottom: 4px"
                  value="start"
                  @input="${e => this.transport.set({ command: 'start' })}"
                ></sc-button>
                <sc-button
                  style="margin-bottom: 4px"
                  value="pause"
                  @input="${e => this.transport.set({ command: 'pause' })}"
                ></sc-button>
                <sc-button
                  style="margin-bottom: 4px"
                  value="stop"
                  @input="${e => this.transport.set({ command: 'stop' })}"
                ></sc-button>
              </div>
              <!-- <hr /> -->
              <div style="padding: 4px 0;">
                <sc-text
                  readonly
                  value="seek"
                ></sc-text>
                <sc-number
                  value="${this.transport.get('seekPosition')}"
                  @change="${e => this.transport.set({
                    command: 'seek',
                    seekPosition: e.detail.value,
                  })}"
                ></sc-number>
                <sc-bang
                  @input="${e => this.transport.set({ command: 'seek' })}"
                ></sc-bang>
              </div>
              <!-- <hr /> -->
              <div style="padding: 4px 0;">
                <sc-text
                  readonly
                  value="pre-roll"
                ></sc-text>
                <sc-toggle
                  .value="${this.transport.get('enablePreRoll')}"
                  @change="${e => this.transport.set({ enablePreRoll: e.detail.value })}"
                ></sc-toggle>
                <sc-number
                  value="${this.transport.get('preRollDuration')}"
                  @change="${e => this.transport.set({ preRollDuration: e.detail.value })}"
                ></sc-number>
              </div>
              <div style="padding: 4px 0;">
                <sc-text
                  readonly
                  value="loop start"
                ></sc-text>
                <sc-number
                  value="${this.transport.get('loopStart')}"
                  @change="${e => this.transport.set({ loopStart: e.detail.value })}"
                ></sc-number>
              </div>
              <div style="padding: 4px 0;">
                <sc-text
                  readonly
                  value="loop end"
                ></sc-text>
                <sc-number
                  value="${this.transport.get('loopEnd')}"
                  @change="${e => this.transport.set({ loopEnd: e.detail.value })}"
                ></sc-number>
              </div>
              <div style="padding: 4px 0;">
                <sc-text
                  readonly
                  value="loop"
                ></sc-text>
                <sc-toggle
                  ?value="${this.transport.get('loop')}"
                  @change="${e => this.transport.set({
                    command: 'loop',
                    loop: e.detail.value
                  })}"
                ></sc-toggle>
              </div>
            </div>
          ` : nothing
        }
      </div>
    `, this.$container);
  }
}

export default PlayerExperience;
