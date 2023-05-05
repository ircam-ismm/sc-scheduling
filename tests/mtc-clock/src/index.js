import "core-js/stable";
import "regenerator-runtime/runtime";
import { render, html, nothing } from 'lit/html.js';
import { resumeAudioContext } from '@ircam/resume-audio-context';
import { getTime } from '@ircam/sc-gettime';

import { Scheduler, Transport, MTCSend, MTCReceive } from '../../../src/index.js';

import '@ircam/simple-components/sc-bang.js';
import '@ircam/simple-components/sc-clock.js';
import '@ircam/simple-components/sc-transport.js';
import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-toggle.js';
import '@ircam/simple-components/sc-number.js';

import { JZZ } from 'jzz';

console.info('> self.crossOriginIsolated', self.crossOriginIsolated);

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const scheduler = new Scheduler(getTime);
const transport = new Transport(scheduler);

let midiAccessState = "pending";

let mtcSend;
let mtcReceive;

let driftErrorCounter = 0;

const midiDeviceList = {
  input: [],
  output: [],
}

const mtcParams = {
  framerate: 25,
  ticksPerFrame: 4,
  maxDriftError: 8,
  lookAhead: 30,
  inputInterface: '',
  outputInterface: '',
};

function createMTCSend() {
  setTransportState('stop');
  mtcSend = new MTCSend(getTime, transport, mtcParams);
  transport.add(mtcSend);
  updateView();
}

function deleteMTCSend() {
  transport.remove(mtcSend);
  mtcSend.closeEngine();
  mtcSend = null;
  setTransportState('stop');
}

function createMTCReceive() {
  setTransportState('stop');
  mtcReceive = new MTCReceive(getTime, transport, mtcParams, {
    onStart: (time) => {
      setTransportState('play', time);
    },
    onSeek: (time, position) => {
      // console.log('seek', time, position);
      setTransportState('seek', time, position)
    },
    onPause: (time) => {
      setTransportState('pause', time);
    },
    onDrift: () => {
      driftErrorCounter += 1;
    }
  });
  // this will call the onTransportEvent method
  transport.add(mtcReceive);
  updateView();
}

function deleteMTCReceive() {
  transport.remove(mtcReceive);
  mtcReceive.closeEngine();
  mtcReceive = null;
  setTransportState('stop');
}

function midiSuccessAccess(webmidi) {
  midiAccessState = "success";

  webmidi.outputs.forEach(function(port) { midiDeviceList.output.push(port.name) });
  webmidi.inputs.forEach(function(port) { midiDeviceList.input.push(port.name) });
  JZZ.close();


  // JZZ init
  mtcParams.inputInterface = midiDeviceList.input[0];
  mtcParams.outputInterface = midiDeviceList.output[0];

  updateView();
}

function midiFailAccess() {
  midiAccessState = "failed";
  updateView();
}

function setTransportState(state, time = null, pos = 0) {
  const now = getTime() + 0.05;
  if (!time) {
    time = now
  }

  switch (state) {
    case 'play': {
      transport.cancel(now);
      transport.play(time);
      break;
    }
    case 'stop': {
      transport.cancel(now);
      transport.pause(now);
      transport.seek(now, 0);
      break;
    }
    case 'seek': {
      transport.cancel(now);
      transport.pause(now);
      transport.seek(now, pos);
      break;
    }
    case 'pause': {
      transport.pause(now);
      break;
    }
  }
  const delta = (time-now)+0.1;
  setTimeout(updateView, delta*1000);
}

function getTransportState() {
  let state;
  if (!mtcReceive) {
    state = transport.getState().currentState.speed === 0 ? 'stop' : 'play';
  } else {
    state = transport.getState().currentState.speed === 0 ? 'pause' : 'play';
  }
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
  ${!mtcReceive ?
  html`
    <sc-transport
      buttons="[play, stop]"
      width="50"
      state="${getTransportState()}"
      @change=${e => setTransportState(e.detail.value)}
    ></sc-transport>`
    :
  html`
    <sc-transport
      buttons="[play, pause]"
      width="50"
      state="${getTransportState()}"
    ></sc-transport>
  `}
  <sc-text
    value="midi access state is ${midiAccessState}"
    readonly
  ></sc-text><br/>
  <sc-text
    value="active MTC Receive"
    readonly
  ></sc-text>
  <sc-toggle
    @change=${(e) => e.detail.value ? createMTCReceive() : deleteMTCReceive()}
    ?disabled=${mtcSend}
  ></sc-toggle>
  </br>
  <sc-text
    value="active MTC Send"
    readonly
  ></sc-text>
  <sc-toggle
    @change=${(e) => e.detail.value ? createMTCSend() : deleteMTCSend()}
    ?disabled=${mtcReceive}
  ></sc-toggle>
  </br>
  <sc-text
    value="input device"
    readonly
  ></sc-text>
  <select
    @change=${e => mtcParams.inputInterface = e.target.value}
    ?disabled=${mtcSend || mtcReceive}
  >
    ${Object.keys(midiDeviceList.input).map(name => {
      return html`<option value="${midiDeviceList.input[name]}" ?selected="${name === mtcParams.inputInterface}">${midiDeviceList.input[name]}</option>`;
    })}
  </select>
  <br/>
  <sc-text
    value="output device"
    readonly
  ></sc-text>
  <select
    @change=${e => mtcParams.outputInterface = e.target.value}
    ?disabled=${mtcSend || mtcReceive}
  >
    ${Object.keys(midiDeviceList.output).map(name => {
      return html`<option value="${midiDeviceList.output[name]}" ?selected="${name === mtcParams.outputInterface}">${midiDeviceList.output[name]}</option>`;
    })}
  </select>
  <br/>
  <sc-text
    value="mtc framerate"
    readonly
  ></sc-text>
  <select
    @change=${e => mtcParams.framerate = parseInt(e.target.value)}
    ?disabled=${mtcSend || mtcReceive}
  >
    ${[24, 25, 30].map(framerate => {
      return html`
        <option value="${framerate}" ?selected="${framerate === mtcParams.framerate}">${framerate}</option>
      `;
    })}
  </select>
  <br/>
  <sc-text
    value="max drift error in frame"
    readonly
  ></sc-text>
  <input
    @input=${e => mtcParams.maxDriftError = parseInt(Math.max(e.target.value,0))}
    value="${mtcParams.maxDriftError}"
    type="number"
    min="0"
    ?disabled=${mtcSend || mtcReceive}
  ></input>
  </br>
  <sc-text
    value="drift counter ${driftErrorCounter} reset :"
    readonly
  ></sc-text>
  <sc-bang
    @input=${e => {
      driftErrorCounter = 0;
      updateView();
    }}
  ></sc-bang>
`, document.body);
}


(async function main() {
  await resumeAudioContext(audioContext);

  JZZ.requestMIDIAccess().then(midiSuccessAccess, midiFailAccess);

  updateView();

}());
