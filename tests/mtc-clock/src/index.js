import "core-js/stable";
import "regenerator-runtime/runtime";
import { render, html } from 'lit/html.js';
import { resumeAudioContext } from '@ircam/resume-audio-context';
import { getTime } from '@ircam/sc-gettime';

import { Scheduler, Transport, MTCSend, MTCReceive } from '../../../src/index.js';

import '@ircam/simple-components/sc-bang.js';
import '@ircam/simple-components/sc-clock.js';
import '@ircam/simple-components/sc-transport.js';
import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-toggle.js';

import { JZZ } from 'jzz';

console.info('> self.crossOriginIsolated', self.crossOriginIsolated);

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const scheduler = new Scheduler(getTime);
const transport = new Transport(scheduler);

let midiAccessState = "pending";

let inputDeviceList = [];
let outputDeviceList = [];

let selectedInInterface;
let selectedOutInterface;

let mtcSend;
let mtcReceive;

function createMTCSend(midiInterface) {
  mtcSend = new MTCSend(midiInterface, getTime, transport);
  transport.add(mtcSend);
}

function createMTCReceive(midiInterface) {
  mtcReceive = new MTCReceive(midiInterface, getTime, transport, {
    onStart: (time) => {
      console.log('play', time);
      const now = getTime();
      transport.cancel(now);
      transport.play(time);
      updateView();
    },
    onSeek: (time, position) => {
      // console.log('seek', time, position);
      const now = getTime();
      transport.cancel(now);
      transport.pause(now);
      transport.seek(time, position);
    },
    onPause: (time) => {
      console.log('pause', time);
      const now = getTime();
      transport.cancel(now);
      transport.pause(time);
      transport.seek(time, 0);
      updateView();
    },
  });
  // this will call the onTransportEvent method
  transport.add(mtcReceive);
}

function midiSuccessAccess(webmidi) {
  midiAccessState = "success";

  webmidi.outputs.forEach(function(port) { outputDeviceList.push(port.name) });
  webmidi.inputs.forEach(function(port) { inputDeviceList.push(port.name) });
  JZZ.close();

  updateView();

  // JZZ init
  selectedInInterface = inputDeviceList[0];
  selectedOutInterface = outputDeviceList[0];

}

function midiFailAccess() {
  midiAccessState = "failed";
  updateView();
}

function setTransportState(state) {
  const now = getTime() + 0.05;

  switch (state) {
    case 'play': {
      transport.cancel(now);
      transport.play(now);
      break;
    }
    case 'stop': {
      transport.cancel(now);
      transport.pause(now);
      transport.seek(now, 0);
      break;
    }
  }
}

function getTransportState() {
  const state = transport.getState().currentState.speed === 0 ? 'play' : 'stop';
  return state
}

function updateView() {
  render(html`
  <h2>js-prototyping-template</h2>
  <sc-clock
    .getTimeFunction="${() => {
      const now = getTime();
      return transport.getPositionAtTime(now);
    }}"
  ></sc-clock>
  <sc-transport
    buttons="[play, stop]"
    width="50"
    state="${getTransportState()}"
    @change=${e => setTransportState(e.detail.value)}
  ></sc-transport>
  <sc-text
    value="midi access state is ${midiAccessState}"
    readonly
  ></sc-text><br/>
  <sc-text
    value="midi input device list"
    readonly
  ></sc-text>
  <select
    @change=${e => selectedInterface = e.target.value}
  >
  ${Object.keys(inputDeviceList).map(name => {
    return html`<option value="${inputDeviceList[name]}">${inputDeviceList[name]}</option>`;
  })}
  </select><br/>
  <sc-text
    value="midi output device list"
    readonly
  ></sc-text>
  <select
    @change=${e => selectedInterface = e.target.value}
  >
  ${Object.keys(outputDeviceList).map(name => {
    return html`
      <option value="${outputDeviceList[name]}">${outputDeviceList[name]}</option>`;
  })}
  </select><br/>
  <sc-text
    value="active MTC Send"
    readonly
  ></sc-text>
  <sc-toggle
    @change="${(e) => {
      if (e.detail.value === true) {
        createMTCSend(selectedOutInterface);
      } else {
        transport.remove(mtcSend);
        mtcSend.closeEngine();
      }
    }}"
  ></sc-toggle><br/>
  <sc-text
    value="active MTC Receive"
    readonly
  ></sc-text>
  <sc-toggle
    @change="${(e) => {
      if (e.detail.value === true) {
        createMTCReceive(selectedInInterface);
      } else {
        transport.remove(mtcReceive);
        const now = getTime();
        transport.cancel(now);
        transport.pause(now);
        transport.seek(now,0);
        mtcReceive.closeEngine();
      }
    }}"
  ></sc-toggle><br/>
`, document.body);
}


(async function main() {
  await resumeAudioContext(audioContext);

  JZZ.requestMIDIAccess().then(midiSuccessAccess, midiFailAccess);

  updateView();

}());
