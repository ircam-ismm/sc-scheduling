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
```

## Notes

- [ ] use symbols for current `master` and `queueTime` key added to engines by Scheduler and PriorityQueue.

## Todos

Proposal for Timeline API

```js
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
