# `@ircam/sc-scheduling`

_Warning: this library is in development_

## Terminology

- `time` refers to the timeline of the parent
- `position` refers to the timeline of the children

- `Transport` is the thing that control timelines or engines with play / pause / etc.
- `Timeline` is an abstraction that can host abstractions and place them in time according to each others

## Transport example

```js
const scheduler = new Scheduler(() => Date.now() / 1000);

const transport = new Transport(scheduler);

const player = {
  onTransportEvent(event, position, audioTime, dt) {
    // such default should be quite good for any engine that rely only an advanceTime
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
```

## Todos

- [ ] use symbols for current `master` and `queueTime` key added to engines by Scheduler and PriorityQueue.
- [ ] Merge and simplify Scheduler and SchedulingQueue
- [ ] Documentation
- [ ] Harmonize semantics of `onTransportEvent` and `advanceTime` return values:
  - number (respectively >= or strictly >) to input param, schedule next call
  - for advance it can be handy to return the same time, e.g. to play a chord,
    maybe define some max number of same time event before the scheduler drop the engine? this could be a variable
  - rename `onTransportEvent` to `onControlEvent` -> should be semantically correct for `Timeline` too later
  - ±Infinity keep in scheduler (review scheduling queue)
  - else remove from schdeuler



## Notes

Proposal for Timeline API

```js
// ----------------------------------------
// timeline
// ----------------------------------------
const Transport = new Transport(scheduler);
const timeline = new Timeline();

transport.add(timeline);

timeline.add(player);
timeline.move(engine, 0, 4);

transport.play(1);
transport.seek(3, 23.5); // seek at position 23.5
// stop and seek to zero
transport.pause(5); 
transport.seek(5, 0);

```
