import { html } from 'lit';
import applyStyle from './utils/applyStyle.js';
import { Scheduler } from '../../src/index.js';
// globals
window.audioContext = window.audioContext || null;
window.Scheduler = Scheduler;

const defaultCode = `\
/**
 * This interactive example code assumes two things:
 * - you have a resumed AudioContext instance at hand
 * - the Scheduler instance **must** be named "scheduler"
 *
 * You can edit the code and hear/see the result by pressing "Cmd+S"
 */

// instantiate scheduler with the audio context timeline
const getTime = () => audioContext.currentTime;
const scheduler = new Scheduler(getTime);

// simple metronome
const BPM = 120;
const metro = currentTime => {
  // create the audio graph for this tick
  const envelop = audioContext.createGain();
  envelop.connect(audioContext.destination);
  envelop.gain.value = 0;
  envelop.gain.setValueAtTime(0, currentTime);
  envelop.gain.linearRampToValueAtTime(0.8, currentTime + 0.002);
  envelop.gain.linearRampToValueAtTime(0, currentTime + 0.01);

  const sine = audioContext.createOscillator();
  sine.connect(envelop);
  sine.frequency.setValueAtTime(600, currentTime);
  sine.start(currentTime);
  sine.stop(currentTime + 0.01);

  // define a period in seconds according to BPM and compute next time
  const period = 60 / BPM;
  const nextTime = currentTime + period;
  // return the next time at which the metronome should play
  return nextTime;
}

// add the metronome to the scheduler, starting now
const now = getTime();
scheduler.add(metro, now);
`

async function executeCode(str) {
  if (window.audioContext) {
    await window.audioContext.close();
  }

  window.audioContext = new AudioContext();
  await window.audioContext.resume();

  if (window.module) {
    await window.module.exit();
  }

  // umute mute button
  document.querySelector('#mute').value = false;
  // handle module, we need to clear the scheduler or they catch up at some point
  str += `
export function exit() {
  scheduler.clear();
}
`;
  const file = new File([str], `module-${parseInt(Math.random() * 1e9)}.js`, { type: 'text/javascript' });
  const url = URL.createObjectURL(file);
  // make sure the module is not garbage collected
  window.module = await import(/* webpackIgnore: true */url);
}


export const enter = () => {}
export const exit = () => {}

export const template = html`
<h2>Scheduler - simple demo</h2>

<div class="demo">
  <div class="interface">
    <sc-button
      @input=${async () => document.querySelector('sc-editor').save()}
    >Run the demo</sc-button>
    <sc-text>mute</sc-text>
    <sc-toggle
      id="mute"
      @change=${async e => {
        if (e.detail.value) {
          await window.audioContext.suspend();
        } else {
          await window.audioContext.resume();
        }
      }}
    ></sc-toggle>
  </div>
  <sc-editor
    save-button
    style="width: 100%; height: 700px;"
    value=${defaultCode}
    @change=${e => executeCode(e.detail.value)}
  ></sc-editor>

</div>
`;
