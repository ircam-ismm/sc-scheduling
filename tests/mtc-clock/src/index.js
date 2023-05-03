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

let inputDeviceList = [];
let outputDeviceList = [];

let selectedInInterface;
let selectedOutInterface;

let mtcSend;
let mtcReceive;

const mtcReceiveParams = {
  framerate: 25,
  ticksPerFrame: 4,
  maxDriftError: 8,
  lookAhead: 30
};

const mtcSendParams = {
  framerate: 25,
  ticksPerFrame: 4
};

function createMTCSend(midiInterface) {
  setTransportState('stop');
  mtcSend = new MTCSend(midiInterface, getTime, transport, mtcReceiveParams);
  transport.add(mtcSend);
  updateView();
}

function deleteMTCSend() {
  transport.remove(mtcSend);
  mtcSend.closeEngine();
  mtcSend = null;
  setTransportState('stop');
}

function createMTCReceive(midiInterface) {
  mtcReceive = new MTCReceive(midiInterface, getTime, transport, mtcReceiveParams, {
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

  webmidi.outputs.forEach(function(port) { outputDeviceList.push(port.name) });
  webmidi.inputs.forEach(function(port) { inputDeviceList.push(port.name) });
  JZZ.close();


  // JZZ init
  selectedInInterface = inputDeviceList[0];
  selectedOutInterface = outputDeviceList[0];

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
  ${!mtcSend ? html`
    <sc-toggle
    @change="${(e) => {
      if (e.detail.value === true) {
        createMTCReceive(selectedInInterface);
      } else {
        deleteMTCReceive();
      }
    }}"
    ></sc-toggle>
  ` : nothing}
  </br>
  <sc-text
    value="active MTC Send"
    readonly
  ></sc-text>
  ${!mtcReceive ? html`
    <sc-toggle
    @change="${(e) => {
      if (e.detail.value === true) {
        createMTCSend(selectedOutInterface);
      } else {
        deleteMTCSend();
      }
    }}"
    ></sc-toggle>` : nothing}
  </br>
  <sc-text
    value="input device = ${selectedInInterface}"
    readonly
  ></sc-text>
  ${(!mtcReceive && !mtcSend) ? html`
    <select
      @change=${e => selectedInInterface = e.target.value}
    >
    <option>please select</option>
    ${Object.keys(inputDeviceList).map(name => {
      return html`<option value="${inputDeviceList[name]}">${inputDeviceList[name]}</option>`;
    })}
    </select>
  ` : nothing}
  <br/>
  <sc-text
    value="output device = ${selectedOutInterface}"
    readonly
  ></sc-text>
  ${(!mtcReceive && !mtcSend) ? html`
    <select
      @change=${e => selectedOutInterface = e.target.value}
    >
    <option>please select</option>
    ${Object.keys(outputDeviceList).map(name => {
      return html`
        <option value="${outputDeviceList[name]}">${outputDeviceList[name]}</option>`;
    })}
    </select>
  ` : nothing}
  <br/>
  <sc-text
    value="mtc receive framerate = ${mtcReceiveParams.framerate}"
    readonly
  ></sc-text>
  ${(!mtcReceive && !mtcSend) ? html`
  <select
    @change=${e => mtcReceiveParams.framerate = e.target.value}
    value=${mtcReceiveParams.framerate}
  >
    <option value="">please select</option>
    <option value="24">24</option>
    <option value="25">25</option>
    <option value="30">30</option>
  </select>` : nothing}
  <br/>
  <sc-text
    value="mtc send framerate = ${mtcSendParams.framerate}"
    readonly
  ></sc-text>
  ${(!mtcReceive && !mtcSend) ? html`
  <select
    @change=${e => mtcSendParams.framerate = e.target.value}
    value=${mtcSendParams.framerate}
  >
    <option value="">please select</option>
    <option value="24">24</option>
    <option value="25">25</option>
    <option value="30">30</option>
  </select><br/>` : nothing}
  <br/>
`, document.body);
}


(async function main() {
  await resumeAudioContext(audioContext);

  JZZ.requestMIDIAccess().then(midiSuccessAccess, midiFailAccess);

  updateView();

}());
