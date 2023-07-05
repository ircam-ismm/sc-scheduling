import hrtime from 'browser-hrtime';
import JZZ from 'jzz';
import NanoTimer from 'nanotimer';
import Timecode from 'smpte-timecode';

/**
 * @warning
 * MTCReceive and MTCSend are not published yet and will probably be moved
 * away from this repository
 */

process.version = '16.12.0';

export default class MTCReceive {
  constructor(getTimeFunction, transport, params, transportCallbacks) {
    // function dependencies
    this.getTime = getTimeFunction;
    this.transport = transport;

    this._onStart = transportCallbacks.onStart;
    this._onSeek = transportCallbacks.onSeek;
    this._onPause = transportCallbacks.onPause;
    this._onDrift = transportCallbacks.onDrift;

    // these default variables are the one used by reaper
    this.framerate = params.framerate;
    this.ticksPerFrame = params.ticksPerFrame;

    // number of frames of deviation accepted between remote and local position.
    // If the delta if greater than position error, we seek.
    this.maxDriftError = params.maxDriftError; // en Frames

    this.lookAhead = params.lookAhead; // FPS

    // private variables
    this.localTime = this.getTime(); // updated when a tick is received
    this.remoteTime = Timecode(0, this.framerate, false);
    this.checkRemoteState = 'pause';
    this.remoteSyncCounter = 0;
    this.blockIncomeMsg = false;

    this.receiveTC = this.receiveTC.bind(this);

    // Init JZZ stuff
    this.input = JZZ().or('Cannot start MIDI engine!')
      .openMidiIn(params.inputInterface).or('MIDI-In: Cannot open!')
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
    this.checkRemoteState = 'pause';
    this.remoteSyncCounter = 0;
    this.blockIncomeMsg = false;
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

  receiveTC(msg) {
    if (this.slaveClock.read(msg)) {

      this.localTime = this.getTime();
      this.remoteTime = Timecode(this.slaveClock.toString(), this.framerate, false);

      // 8 frames of synchronisation before trusting JZZ remote timecode
      while (this.remoteSyncCounter < 32) {
        this.remoteSyncCounter += 1;
        return;
      }

      if (!this.blockIncomeMsg) {
        // reset flag to handle next stop

        if (this.checkRemoteState === 'pause') {
            //play !
            this.remoteTime.add(this.lookAhead);

            const playFrom = this.SMPTEToSeconds(this.remoteTime.toString());
            const playAt = this.localTime + this.frameToSeconds(this.lookAhead);

            this._onSeek(this.localTime, playFrom);
            this._onStart(playAt);

            // console.log(`seek to ${playFrom} -- schedule play at ${playAt}`);

            this.checkRemoteState = 'play';

            // block execution while syncing
            this.blockIncomeMsg = true;
            const blockTime = this.frameToSeconds(this.lookAhead);
            this.timer.setTimeout(() => {
              this.blockIncomeMsg = false;
            }, '', `${blockTime}s`);

        } else {
          // chasing....
          // computing position delta between local and remote clocks
          const localPosition = this.transport.getPositionAtTime(this.localTime);
          const remotePosition = this.SMPTEToSeconds(this.remoteTime.toString());
          const clockDiff = Math.abs(localPosition - remotePosition);

          if (clockDiff > this.frameToSeconds(this.maxDriftError)) {
            console.log(`more than ${this.maxDriftError} frames out of sync...`);
            this._onDrift();
            // pause transport and schedule a new start
            this._onPause(this.localTime);
            this.checkRemoteState = 'pause';
            this.remoteSyncCounter = 0;
          } else {
            // everything is synced and alright
          }
        }
      } else {
        // execution is blocked by blockIncomeMsg flag
      }
    } else {
      // slave clock is not synchronised now
    }
}

  syncClock() {
    const now = this.getTime();
    const clockDt = now - this.localTime;
    // time between 2 ticks
    const acceptedClockDrift = this.frameToSeconds(this.lookAhead);

    if (clockDt > acceptedClockDrift) {
      // reset tc flag to handle next start

      if (this.checkRemoteState === 'play') {
        this._onPause(now);
        // block incoming messages to re-sync clock
        this.checkRemoteState = 'pause';
        this.remoteSyncCounter = 0;
      }

    } else {
      // console.log("clock is in sync, chasing...");
    }
  }
};
