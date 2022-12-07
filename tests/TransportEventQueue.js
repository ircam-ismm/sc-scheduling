import { assert } from 'chai';
import TransportEventQueue from '../src/TransportEventQueue.js';

describe('TransportEventQueue.add(event)', () => {
  it(`should check event.type`, () => {
    const queue = new TransportEventQueue();

    assert.throw(() => {
      queue.add({ type: 'unknown' });
    })
  });

  // it(`should return clean events`, () => {
  //   const queue = new TransportEventQueue();
  //   const events = [
  //     {
  //       type: 'play',
  //       time: 0,
  //       speed: 1,
  //     }, {
  //       type: 'pause',
  //       time: 2,
  //       speed: 1,
  //     }
  //   ];

  //   const result = events.map(e => queue.add(e));

  //   assert.deepEqual(result, [
  //     { type: 'play', time: 0, speed: 1, position: 0 },
  //     { type: 'pause', time: 2, speed: 0, position: 2 }
  //   ]);
  // });

  it.only('should filter similar consecutive events except seek', () => {
    const queue = new TransportEventQueue();

    const events = [
      'play', 'play',
      'seek',
      'seek',
      'pause', 'pause',
      'seek',
      'pause', 'pause',
      'play',
      'pause', 'pause',
    ];

    const expected = [
      'play', 'seek', 'seek', 'pause', 'seek', 'play', 'pause'
    ];

    events.forEach((type, i) => {
      queue.add({
        type,
        time: i,
      });
    });

    const queuedTypes = queue._queue.filter(e => e !== null).map(e => e.type);
    assert.deepEqual(queuedTypes, expected);
  });

  it('should recompute positions and speeds', () => {
    // index 0 and 1 of the queue are last and current events which are null
    // as we don't dequeue anything
    const queue = new TransportEventQueue();

    queue.add({
      type: 'play',
      time: 0,
    });

    queue.add({
      type: 'pause',
      time: 2,
      speed: 0,
    });

    assert.deepEqual(queue._queue[3], {
      type: 'pause',
      time: 2,
      speed: 0,
      position: 2,
    });

    // --------------------------------------------------------
    // insert a seek to 2 at 1 sec
    // --------------------------------------------------------
    queue.add({
      type: 'seek',
      time: 1,
      position: 2,
    });

    assert.deepEqual(queue._queue[3], { // should be seek
      type: 'seek',
      time: 1,
      speed: 1, // should have position set to 1
      position: 2,
    });

    assert.deepEqual(queue._queue[4], { // should be paused
      type: 'pause',
      time: 2,
      speed: 0,
      position: 3,
    });

    // --------------------------------------------------------
    // insert a seek to 42 at 3 sec
    // --------------------------------------------------------
    queue.add({
      type: 'seek',
      time: 3,
      position: 42,
    });

    assert.deepEqual(queue._queue[3], { // should be seek
      type: 'seek',
      time: 1,
      speed: 1, // should have position set to 1
      position: 2,
    });

    assert.deepEqual(queue._queue[4], { // should be pause
      type: 'pause',
      time: 2,
      speed: 0,
      position: 3,
    });

    assert.deepEqual(queue._queue[5], { // should be stop
      type: 'seek',
      time: 3,
      speed: 0,
      position: 42,
    });
  });

  it('should return event with proper estimation or null if discarded', () => {
    const queue = new TransportEventQueue();

    queue.add({
      type: 'play',
      time: 0,
    });

    const res1 = queue.add({
      type: 'pause',
      time: 2,
    });

    // console.log(res1);
    assert.deepEqual(res1, { // should be stop
      type: 'pause',
      time: 2,
      position: 2,
      speed: 0,
    });

    const res2 = queue.add({
      type: 'pause',
      time: 4,
    });

    // console.log(res2);
    assert.equal(res2, null);
  });

  it('should clear events w/ time greater or equal to cancel time', () => {
    const queue = new TransportEventQueue();

    queue.add({
      type: 'play',
      time: 0,
    });

    queue.add({
      type: 'pause',
      time: 2,
    });

    queue.add({
      type: 'play',
      time: 3,
    });

    queue.add({
      type: 'pause',
      time: 4,
    });

    queue.add({
      type: 'cancel',
      time: 3,
    });

    {
      // should only remain last and current events
      const types = queue._queue.map(e => e.type);
      const expected = ['play', 'pause'];
      assert.deepEqual(types, expected);
    }
  });
});
