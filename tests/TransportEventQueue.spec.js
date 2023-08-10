import { assert } from 'chai';
import TransportEventQueue from '../src/TransportEventQueue.js';

describe(`TransportEventQueue`, () => {
  describe('#add(event)', () => {
    it(`should check event.type`, () => {
      const queue = new TransportEventQueue();

      assert.throw(() => {
        queue.add({ type: 'unknown' });
      })
    });

    it('should filter similar consecutive events except seek and loop', () => {
      const queue = new TransportEventQueue();

      const events = [
        'play', 'play',
        'seek',
        'seek',
        'pause', 'pause',
        'seek',
        'pause', 'pause',
        'play',
        'loop', 'loop',
        'pause', 'pause',
      ];

      const expected = [
        'play', 'seek', 'seek', 'pause', 'seek', 'play', 'loop', 'loop', 'pause'
      ];

      events.forEach((type, i) => {
        queue.add({
          type,
          time: i,
        });
      });

      const queuedTypes = queue.scheduledEvents.filter(e => e !== null).map(e => e.type);
      assert.deepEqual(queuedTypes, expected);
    });

    it('should insert event in queue in right position', () => {
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
        type: 'seek',
        time: 1,
      });

      const expected = ['play', 'seek', 'pause'];
      const result = queue.scheduledEvents.map(e => e.type);

      assert.deepEqual(result, expected);
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
        const types = queue.scheduledEvents.map(e => e.type);
        const expected = ['play', 'pause'];
        assert.deepEqual(types, expected);
      }
    });

    it('should return event with proper estimation or null if discarded', () => {
      const queue = new TransportEventQueue();

      const res1 = queue.add({
        type: 'pause',
        time: 2,
      });

      assert.deepEqual(res1, { // should be stop
        type: 'pause',
        time: 2,
      });

      const res2 = queue.add({
        type: 'pause',
        time: 4,
      });

      // console.log(res2);
      assert.equal(res2, null);
    });
  });

  describe('#dequeue()', () => {
    it('should properly compute state when a event is dequeued', () => {
      // index 0 and 1 of the queue are last and current events which are null
      // as we don't dequeue anything
      const queue = new TransportEventQueue();

      // --------------------------------------------------------
      // play
      // --------------------------------------------------------
      queue.add({
        type: 'play',
        time: 0,
      });

      queue.dequeue();

      assert.deepEqual(queue.state, {
        type: 'play',
        time: 0,
        speed: 1,
        position: 0,
        loop: false,
        loopStart: 0,
        loopEnd: Infinity,
      });

      // --------------------------------------------------------
      // pause
      // --------------------------------------------------------
      queue.add({
        type: 'pause',
        time: 2,
        speed: 0,
      });

      queue.dequeue();

      assert.deepEqual(queue.state, {
        type: 'pause',
        time: 2,
        speed: 0,
        position: 2,
        loop: false,
        loopStart: 0,
        loopEnd: Infinity,
      });

      // --------------------------------------------------------
      // seek
      // --------------------------------------------------------
      queue.add({
        type: 'seek',
        time: 2,
        position: 42,
      });

      queue.dequeue();

      assert.deepEqual(queue.state, {
        type: 'seek',
        time: 2,
        speed: 0,
        position: 42,
        loop: false,
        loopStart: 0,
        loopEnd: Infinity,
      });


      // --------------------------------------------------------
      // loop
      // --------------------------------------------------------
      queue.add({
        type: 'loop',
        time: 4,
        loop: true,
      });

      queue.dequeue();

      assert.deepEqual(queue.state, {
        type: 'loop',
        time: 4,
        speed: 0,
        position: 42,
        loop: true,
        loopStart: 0,
        loopEnd: Infinity,
      });
    });
  });

  describe(`getTimeAtPosition()`, () => {
    it.only(`should handle infinity`, () => {
      const queue = new TransportEventQueue();

      queue.add({ type: 'play', time: 0 });
      const res = queue.getTimeAtPosition(Infinity);
      assert.equal(res, Infinity);
    });
  });
});
