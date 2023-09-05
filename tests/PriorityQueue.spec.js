import { assert } from 'chai';

import { priorityQueueTime } from '../src/utils.js';
import PriorityQueue from '../src/PriorityQueue.js';

// const queueSize = 20;
const queueSize = 1e4;

describe('# PriorityQueue - public API [smoke testing]', () => {
  it(`.add(entry, time) / remove(entry)`, () => {
    const priorityQueue = new PriorityQueue(queueSize);

    for (let i = 0; i < queueSize; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.add(obj, time);
    }

    let lastTime = -Infinity;

    for (let i = 0; i < queueSize; i++) {
      const time = priorityQueue.time;
      const obj = priorityQueue.head;

      assert.equal(time >= lastTime, true);
      lastTime = time;

      priorityQueue.remove(obj);
    }

    assert.equal(priorityQueue.head, undefined);
  });

  it(`.move(entry, time)`, () => {
    const priorityQueue = new PriorityQueue(queueSize);

    let stack = new Map();

    for (let i = 0; i < queueSize; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.add(obj, time);
      stack.set(obj, time);
    }

    // randomly move everything
    stack.forEach((time, obj) => {
      const newTime = Math.random() * 1000;
      priorityQueue.move(obj, newTime);
    });

    let lastTime = -Infinity;

    for (let i = 0; i < queueSize; i++) {
      const time = priorityQueue.time;
      const obj = priorityQueue.head;

      const initTime = stack.get(obj);

      assert.notEqual(time, initTime);
      assert.equal(time >= lastTime, true);

      lastTime = time;

      priorityQueue.remove(obj);
    }

    assert.equal(priorityQueue.head, undefined);
  });

  it(`.has(entry)`, () => {
    const priorityQueue = new PriorityQueue(100);
    const a = {};
    const b = {};
    priorityQueue.add(a, 1);

    assert.equal(priorityQueue.has(a), true);
    assert.equal(priorityQueue.has(b), false);
  });

  it(`.reverse = true`, () => {
    const priorityQueue = new PriorityQueue(queueSize);

    for (let i = 0; i < queueSize; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.add(obj, time);
    }

    priorityQueue.reverse = true;

    let lastTime = +Infinity;

    for (let i = 0; i < queueSize; i++) {
      const time = priorityQueue.time;
      const obj = priorityQueue.head;

      assert.equal(time <= lastTime, true);
      lastTime = time;

      priorityQueue.remove(obj);
    }

    assert.equal(priorityQueue.head, undefined);
  });
});

describe(`PriorityQueue - internals`, () => {
  it('store queue time has symbol', () => {
    const priorityQueue = new PriorityQueue(10);

    const obj = { a: true };
    priorityQueue.add(obj, 0.1);

    // not visible for client code
    assert.equal(Object.keys(obj).length, 1);
    assert.deepEqual(Object.getOwnPropertyNames(obj), ['a']);
    for (let name in obj) {
      if (name != 'a') {
        assert.fail('should have only "a" key')
      }
    }
    // except if we really want to
    assert.equal(obj[priorityQueueTime], 0.1);
    assert.deepEqual(Object.getOwnPropertySymbols(obj), [priorityQueueTime]);
  });

  it(`allow +Infinity to be stored in the queue`, () => {
    const queueSize = 20;
    const priorityQueue = new PriorityQueue(queueSize);

    for (let i = 0; i < queueSize - 1; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.add(obj, time);
    }

    priorityQueue.add({}, +Infinity);

    let lastTime = -Infinity;

    for (let i = 0; i < queueSize; i++) {
      const time = priorityQueue.time;
      const obj = priorityQueue.head;

      assert.equal(time >= lastTime, true);

      if (i === queueSize - 1) {
        // object should be store in queue
        assert.notEqual(obj, undefined);
        // it's time should be Infinity
        assert.equal(time, Infinity);
      }

      lastTime = time;

      priorityQueue.remove(obj);
    }

    assert.equal(priorityQueue.head, undefined);
  });

  it(`allow -Infinity to be stored in the queue`, () => {
    const queueSize = 20;
    const priorityQueue = new PriorityQueue(queueSize);

    for (let i = 0; i < queueSize - 1; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.add(obj, time);
    }

    priorityQueue.add({}, -Infinity);

    let lastTime = -Infinity;

    for (let i = 0; i < queueSize; i++) {
      const time = priorityQueue.time;
      const obj = priorityQueue.head;

      assert.equal(time >= lastTime, true);

      if (i === queueSize - 1) {
        // object should be store in queue
        assert.notEqual(obj, undefined);
        // it's time should be Infinity
        assert.equal(time, Infinity);
      }

      lastTime = time;

      priorityQueue.remove(obj);
    }

    assert.equal(priorityQueue.head, undefined);
  });

  it(`gracefully handle NaN to Infinity`, () => {
    const queueSize = 20;
    const priorityQueue = new PriorityQueue(queueSize);

    for (let i = 0; i < queueSize - 1; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.add(obj, time);
    }

    priorityQueue.add({ nanTime: true }, NaN);

    let lastTime = -Infinity;

    for (let i = 0; i < queueSize; i++) {
      const time = priorityQueue.time;
      const obj = priorityQueue.head;

      assert.equal(time >= lastTime, true);

      if (i === queueSize - 1) {
        // object should be store in queue
        assert.notEqual(obj, undefined);
        // it's time should be Infinity
        assert.equal(time, Infinity);
      }

      lastTime = time;

      priorityQueue.remove(obj);
    }

    assert.equal(priorityQueue.head, undefined);
  });
});
