import { assert } from 'chai';

import PriorityQueue from '../src/PriorityQueue.js';

// const queueSize = 20;
const queueSize = 1e4;

describe('# PriorityQueue', () => {
  it(`## add(entry, time) / remove(entry) - smoke testing`, () => {
    const priorityQueue = new PriorityQueue(queueSize);

    for (let i = 0; i < queueSize; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.insert(obj, time);
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

  it(`## reverse = true - smoke testing`, () => {
    const priorityQueue = new PriorityQueue(queueSize);

    for (let i = 0; i < queueSize; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.insert(obj, time);
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

  it(`## move(entry, time) - smoke testing`, () => {
    const priorityQueue = new PriorityQueue(queueSize);

    let stack = new Map();

    for (let i = 0; i < queueSize; i++) {
      const obj = {};
      const time = Math.random() * 1000;
      priorityQueue.insert(obj, time);
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
});
