import { assert } from 'chai';
import TransportEventQueue from '../src/TransportEventQueue.js';

describe(`TransportEventQueue`, () => {
  describe('#add(event)', () => {
    it(`should check event.type`, () => {
      const queue = new TransportEventQueue(0);

      assert.throw(() => {
        queue.add({ type: 'unknown' });
      })
    });

    it('should filter similar consecutive events except seek and loop', () => {
      const queue = new TransportEventQueue(0);

      const events = [
        'start', 'start',
        'seek',
        'seek',
        'pause', 'pause',
        'seek',
        'loop',
        'stop', 'stop',
        'loop-start',
        'loop-start',
        'pause', 'pause',
        'start',
        'loop', 'loop',
        'pause', 'pause',
      ];

      const expected = [
        'start', 'seek', 'seek', 'pause', 'seek', 'loop', 'stop', 'loop-start', 'loop-start', 'pause', 'start', 'loop', 'loop', 'pause'
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
      const queue = new TransportEventQueue(0);

      queue.add({
        type: 'start',
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

      const expected = ['start', 'seek', 'pause'];
      const result = queue.scheduledEvents.map(e => e.type);

      assert.deepEqual(result, expected);
    });

    it('should clear events w/ time greater or equal to cancel time', () => {
      const queue = new TransportEventQueue(0);

      queue.add({
        type: 'start',
        time: 0,
      });

      queue.add({
        type: 'pause',
        time: 2,
      });

      queue.add({
        type: 'start',
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
        const expected = ['start', 'pause'];
        assert.deepEqual(types, expected);
      }
    });

    it('should return event with proper estimation or null if discarded', () => {
      const queue = new TransportEventQueue(0);

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
      const queue = new TransportEventQueue(0);

      // --------------------------------------------------------
      // start
      // --------------------------------------------------------
      queue.add({
        type: 'start',
        time: 0,
      });
      queue.dequeue();

      assert.deepEqual(queue.state, {
        eventType: 'start',
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
        eventType: 'pause',
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
        eventType: 'seek',
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
        eventType: 'loop',
        time: 4,
        speed: 0,
        position: 42,
        loop: true,
        loopStart: 0,
        loopEnd: Infinity,
      });
    });

    it(`should handle speed events`, () => {
      const queue = new TransportEventQueue(0);
      queue.add({ type: 'start', time: 0 });
      queue.add({ type: 'speed', speed: 0.5, time: 0 });
      queue.dequeue();
      queue.dequeue();

      assert.equal(queue.getPositionAtTime(0), 0);
      assert.equal(queue.getTimeAtPosition(0), 0);

      assert.equal(queue.getPositionAtTime(1), 0.5);
      assert.equal(queue.getTimeAtPosition(0.5), 1);

      assert.equal(queue.getPositionAtTime(2), 1);
      assert.equal(queue.getTimeAtPosition(1), 2);

      assert.equal(queue.getPositionAtTime(3), 1.5);
      assert.equal(queue.getTimeAtPosition(1.5), 3);

      queue.add({ type: 'speed', speed: 0.25, time: 3 });
      queue.dequeue();

      assert.equal(queue.getPositionAtTime(4), 1.75);
      assert.equal(queue.getTimeAtPosition(1.75), 4);
    });
  });

  describe(`getTimeAtPosition()`, () => {
    it(`should handle infinity`, () => {
      const queue = new TransportEventQueue(0);

      queue.add({ type: 'start', time: 0 });
      const res = queue.getTimeAtPosition(Infinity);
      assert.equal(res, Infinity);
    });
  });
});
