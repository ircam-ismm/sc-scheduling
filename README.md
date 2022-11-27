# `@ircam/sc-scheduling`


## Terminology

- `time` is the timeline of the parent
- `position` is the timeline of the children

- `Transport` is the thing that control timelines or engines with play / pause / etc.
- `Timeline` is an abstraction that can host abstractions and place them in time according to each others

## TODOS

- [x] `play` (i.e. rename `start` to `play`)
- [x] `pause`
- [x] `seek`
- [x] remove `stop` (is `pause` -> `seek 0`)
- [x] use stable sort

### review queue

- [ ] get last() is never used
- [ ] compute missing informations on events only when they are dequeued
- [ ] simplify `getPositionAtTime` and related to use only current event
- [ ] handle loop start / stop points in queue
- [ ] use loop infos in position/time convertion function
- [ ] use `quantize` in timing functions

### implement loop attributes

- `loopStart`
- `loopEnd`
- `loop` --> internally trigger `pause` -> `seek` -> `play`



```js
const scheduler = new Scheduler(() => Date.now() / 1000);

const transport = new Transport(scheduler);

const player = {
  onTransportEvent(event, position, audioTime, dt) {
    // such default should be quite good for any engine that rely on an advanceTime
    // method (e.g. Granular engine)
    return event.speed > 0 ? position : Infinity;
  }

  // advanceTime(position, audioTime, dt) {

  // }
}

transport.add(player);
// player.use(scheduler);

transport.play(1);
transport.seek(3, 23.5); // seek at position 23.5
// stop and seek to zero
transport.pause(5); 
transport.seek(5, 0);


// ----------------------------------------
// timeline
// ----------------------------------------
const Transport = new Transport(scheduler);
const timeline = new Timeline();

transport.add(timeline);

timeline.add(player);
timeline.setBoundaries();

transport.play(1);
transport.seek(3, 23.5); // seek at position 23.5
// stop and seek to zero
transport.pause(5); 
transport.seek(5, 0);

```
