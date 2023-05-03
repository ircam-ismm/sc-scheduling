import hrtime from 'browser-hrtime';
import JZZ from 'jzz';
import NanoTimer from 'nanotimer';
import Timecode from 'smpte-timecode';

process.version = '16.12.0';

export default class MTCReceive {
  constructor(midiInterface, getTimeFunction, transport, params, transportCallbacks) {
    // function dependencies
    this.getTime = getTimeFunction;
    this.transport = transport;

    this._onStart = transportCallbacks.onStart;
    this._onSeek = transportCallbacks.onSeek;
    this._onPause = transportCallbacks.onPause;

    // these default variables are the one used by reaper
    this.framerate = params.framerate;
    this.ticksPerFrame = params.ticksPerFrame;

    // number of frames of deviation accepted between remote and local position.
    // If the delta if greater than position error, we seek.
    this.maxDriftError = params.maxDriftError; // en Frames

    this.lookAhead = params.lookAhead; // FPS

    // private variables
    this.localTime = this.getTime(); // updated when a tick is received
    this.checkRemoteStart = true;
    this.checkRemoteStop = true;
    this.isPlaying = false;
    this.inSync = false;

    this.receiveTC = this.receiveTC.bind(this);

    // Init JZZ stuff
    this.input = JZZ().or('Cannot start MIDI engine!')
      .openMidiIn(midiInterface).or('MIDI-In: Cannot open!')
      .and(function() { console.log('MIDI-In:', this.name()); });
    this.slaveClock = JZZ.SMPTE(this.framerate,0,0,0);
    this.receiver = JZZ().Widget({ _receive: this.receiveTC });
    this.input.connect(this.receiver);

    // Init local timer
    this.timer = new NanoTimer();
    const tickInterval = 1 / (this.framerate * this.ticksPerFrame);

    this.timer.setInterval(() => { this.syncClock() }, '', `${tickInterval}s`);

  }

  closeEngine() {
    this.input.close();
    this.timer.clearInterval();
    this.inSync = false;
  }

  frameToSeconds(numFrames) {
    return numFrames / this.framerate;
  }

  secondsToSMPTE(seconds, framerate) {
    this._f = Math.floor((seconds % 1) * framerate);
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

  // method that is called by the sc-transport
  onTransportEvent(event, position, currentTime, dt) {
    switch (event.type) {
      case 'play':
        this.isPlaying = true;
        break;
      case 'pause':
        this.isPlaying = false;
        break;
      case 'seek':
        break;
      default:
        break;
    }

    return event.speed > 0 ? position : Infinity;
  }

  receiveTC(msg) {
    this.localTime = this.getTime();

    if (this.slaveClock.read(msg)) {

      // here we should wait for sync, which is 8 QF messages = 2 full frame messages
      setTimeout(() => {
        this.inSync = true;
      },this.frameToSeconds(2)*1000);

     // reset flag to handle next stop
      this.checkRemoteStop = true;

      if (this.checkRemoteStart) {
        if (this.inSync) {
          //play !
          const nowTC = Timecode(this.slaveClock.toString(), this.framerate, false);
          nowTC.add(this.lookAhead);

          const playFrom = this.SMPTEToSeconds(nowTC.toString());
          const playAt = this.localTime + this.frameToSeconds(this.lookAhead);

          this._onSeek(this.localTime, playFrom);
          this._onStart(playAt);

          // console.log(`seek to ${playFrom} -- schedule play at ${playAt}`);

          this.checkRemoteStart = false;
        }

      } else {
        // console.log("chasing...");
        if (this.isPlaying === true) {
          const localPosition = this.transport.getPositionAtTime(this.localTime);
          const remotePosition = this.SMPTEToSeconds(this.slaveClock.toString());
          const clockDiff = Math.abs(localPosition - remotePosition);

          if (clockDiff > this.frameToSeconds(this.maxDriftError)) {
            // console.log("more than 8 frames out of sync...");
            const nowTC = Timecode(this.slaveClock.toString(), this.framerate, false);
            nowTC.add(this.lookAhead);

            const playFrom = this.SMPTEToSeconds(nowTC.toString());
            const playAt = this.localTime + this.frameToSeconds(this.lookAhead);

            // console.log(`seek to ${playFrom} at ${playAt}`);
            this.isPlaying = false;
            this._onSeek(playAt, playFrom);
            setTimeout(() => {this.isPlaying = true}, this.frameToSeconds(this.lookAhead*1000));

          } else {
            // console.log("less than 8 frames out of sync...");
          }
        }
      }
    } else {
      // console.log("synchronizing...");
    }
  }

  syncClock() {
    const now = this.getTime();
    const clockDt = now - this.localTime;
    // time between 2 ticks
    const acceptedClockDrift = this.frameToSeconds(this.maxDriftError);

    if (clockDt > acceptedClockDrift) {
      // reset tc flag to handle next start
      this.checkRemoteStart = true;

      if (this.checkRemoteStop) {
        this._onPause(now);
        // console.log(`pause message now`);
        this.checkRemoteStop = false;
        this.inSync = false;
      }
    } else {
      // console.log("clock is in sync, chasing...");
    }
  }
};
