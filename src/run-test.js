run-test.js


function runTest() {
  // instantiate scheduler with the audio context timeline
  const getTime = () => audioContext.currentTime;
  const scheduler = new Scheduler(getTime);

  // simple metronome
  const BPM = 60;
  const metro = currentTime => {
    // create the audio graph for this tick
    const envelop = audioContext.createGain();
    envelop.connect(audioContext.destination);
    envelop.gain.value = 0;
    envelop.gain.setValueAtTime(0, currentTime);
    envelop.gain.linearRampToValueAtTime(1, currentTime + 0.005);
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
}
