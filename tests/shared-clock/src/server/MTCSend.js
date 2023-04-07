import JZZ from 'jzz';
import NanoTimer from 'nanotimer';

export default class MTCSend {
  constructor(midiInterface, getTimeFunction, transport) {
    // function dependencies
    this.getTime = getTimeFunction;
    this.transport = transport;

    // these default variables are the one used by reaper
    this.framerate = 25;
    this.ticksPerFrame = 4

    // JZZ init
    this.out = JZZ().or('Cannot start MIDI engine!')
      .openMidiOut(midiInterface).or('MIDI-Out: Cannot open!')
      .and(function() { console.log('MIDI-Out:', this.name()); });

    this.master = JZZ().SMPTE(this.framerate,0,0,0);
    this.sender = JZZ().Widget();
    this.sender.connect(this.out);

    // timer init
    this.timer = new NanoTimer();

  }
  secondsToSMPTE(seconds) {
    this._f = Math.floor((seconds % 1) * this.framerate);
    this._s = Math.floor(seconds);
    this._m = Math.floor(this._s / 60);
    this._h = Math.floor(this._m / 60);
    this._m = this._m % 60;
    this._s = this._s % 60;

    return {h: this._h, m: this._m, s: this._s, f: this._f};
  }
  SMPTEToSeconds(timecode) {
    const timeArray = timecode.split(":");
    const hours   = parseInt(timeArray[0]) * 60 * 60;
    const minutes = parseInt(timeArray[1]) * 60;
    const seconds = parseInt(timeArray[2]);
    const frames  = parseInt(timeArray[3])*(1/this.framerate);

    const output = hours + minutes + seconds + frames;

    return output;
  }
  update() {
    const tickInterval = 1 / (this.framerate * this.ticksPerFrame);
    console.log(tickInterval);

    this.timer.setInterval(() => {
      this.sender.mtc(this.master);
      this.master.incrQF();

      // check drift between JZZ SMPTE and local clock
      const localPosition = this.transport.getPositionAtTime(this.getTime());
      const remotePosition = this.SMPTEToSeconds(this.master.toString());
      const clockDiff = Math.abs(localPosition - remotePosition);
      // should do something if drift exeed a value...

    },'',`${tickInterval}s`);

  }
  onTransportEvent(event, position, currentTime, dt) {
    switch (event.type) {
      case 'play':
        this.timer.setTimeout(() => { this.update() }, '', `${dt}s`);
        break;
      case 'pause':
        this.timer.clearInterval();
        break;
      case 'seek':
        const seek = this.secondsToSMPTE(event.position);
        this.master.reset(this.framerate, seek.h, seek.m, seek.s, seek.f);
        break;
      default:
        console.log("unparsed message",event);
        break;
    }
    return event.speed > 0 ? position : Infinity;
  }
};
