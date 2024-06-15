import { quantize } from './utils.js';

function swap(arr, a, b) {
  const tmp = arr[a];
  arr[a] = arr[b];
  arr[b] = tmp;
}

// export for tests
export const kQueueTime = Symbol('sc-scheduling:queue-time');
export const kQueuePriority = Symbol('sc-scheduling:queue-priority');

/**
 * Priority queue implementing a binary heap.
 *
 * The queue acts as a min heap by default, but can be dynamically changed to a
 * max heap by setting `reverse` to true.
 *
 * The queue uses a Symbol (i.e. `Symbol.for('sc-scheduling-queue-time')`)
 * to store the given queue time into the given object. As such this should not
 * be visible for client code
 *
 * @param {Number} [heapLength=1000] - Default size of the array used to create the heap.
 * @private
 */
class PriorityQueue {
  /**
   * Pointer to the first empty index of the heap.
   * @type {Number}
   * @private
   */
  #currentLength = 1;
  /**
   * Array of the sorted indexes of the entries, the actual heap. Ignore the index 0.
   * @type {Array}
   * @private
   */
  #heap = null;

  constructor(heapLength = 1000) {
    this.#heap = new Array(heapLength + 1);
  }

  /**
   * Time of the first element in the binary heap. Returns Infinity if no object
   * registered in the queue yet.
   * @readonly
   * @returns {Number}
   */
  get time() {
    if (this.#currentLength > 1) {
      return this.#heap[1][kQueueTime];
    }

    return Infinity;
  }

  /**
   * First element in the binary heap.
   * @readonly
   * @returns {Number}
   */
  get head() {
    return this.#heap[1];
  }

  /**
   * Define if `entry1` should be lower in the topography than `entry2`.
   * Is dynamically affected to the priority queue according to handle `min` and `max` heap.
   *
   * @param {any} entry1
   * @param {any} entry2
   * @return {Boolean}
   * @private
   */
  #isLower(entry1, entry2) {
    const time1 = entry1[kQueueTime];
    const time2 = entry2[kQueueTime];

    if (time1 === time2) {
      const priority1 = entry1[kQueuePriority];
      const priority2 = entry2[kQueuePriority];
      return priority1 < priority2;
    }

    return time1 > time2;
  }

  /**
   * Define if `entry1` should be higher in the topography than `entry2`.
   * Is dynamically affected to the priority queue according to handle `min` and `max` heap.
   *
   * @param {Number} entry1
   * @param {Number} entry2
   * @return {Boolean}
   * @private
   */
  #isHigher(entry1, entry2) {
    const time1 = entry1[kQueueTime];
    const time2 = entry2[kQueueTime];

    if (time1 === time2) {
      const priority1 = entry1[kQueuePriority];
      const priority2 = entry2[kQueuePriority];
      return priority1 > priority2;
    }

    return time1 < time2;
  }

  /**
   * Fix the heap by moving an entry to a new upper position.
   *
   * @param {Number} startIndex - The index of the entry to move.
   * @private
   */
  #bubbleUp(startIndex) {
    let entry = this.#heap[startIndex];

    let index = startIndex;
    let parentIndex = Math.floor(index / 2);
    let parent = this.#heap[parentIndex];

    while (parent && this.#isHigher(entry, parent)) {
      swap(this.#heap, index, parentIndex);

      index = parentIndex;
      parentIndex = Math.floor(index / 2);
      parent = this.#heap[parentIndex];
    }
  }

  /**
   * Fix the heap by moving an entry to a new lower position.
   *
   * @param {Number} startIndex - The index of the entry to move.
   * @private
   */
  #bubbleDown(startIndex) {
    let entry = this.#heap[startIndex];

    let index = startIndex;
    let c1index = index * 2;
    let c2index = c1index + 1;
    let child1 = this.#heap[c1index];
    let child2 = this.#heap[c2index];

    while ((child1 && this.#isLower(entry, child1)) ||
           (child2 && this.#isLower(entry, child2)))
    {
      // swap with the minimum child
      let targetIndex;

      if (child2) {
        targetIndex = this.#isHigher(child1, child2)
          ? c1index
          : c2index;
      } else {
        targetIndex = c1index;
      }

      swap(this.#heap, index, targetIndex);

      // update to find next children
      index = targetIndex;
      c1index = index * 2;
      c2index = c1index + 1;
      child1 = this.#heap[c1index];
      child2 = this.#heap[c2index];
    }
  }

  /**
   * Build the heap (from bottom up).
   * @private
   */
  #buildHeap() {
    // find the index of the last internal node
    let maxIndex = Math.floor((this.#currentLength - 1) / 2);

    for (let i = maxIndex; i > 0; i--) {
      this.#bubbleDown(i);
    }
  }

  #sanitizeTime(time) {
    if (!Number.isFinite(time)) {
      // ±Infinity should always be at the end of the queue, disregarding its sign.
      // Using Number.isFinite also allows us to handle NaN gracefully
      if (Math.abs(time) !== Infinity) {
        console.warn(`PriorityQueue: time is not a number: "${time}" (overriden to Infinity). This probably shows an error in your implementation.`);
      }

      time = this.reverse ? -Infinity : Infinity;
    } else {
      // Quantize time at µs to mitigate floating point error (tbc)
      time = quantize(time);
    }

    return time;
  }

  /**
   * Insert a new object in the binary heap and sort it.
   *
   * @param {Object} entry - Entry to insert.
   * @param {Number} time - Time at which the entry should be orderer.
   * @param {Number} [priority=0] - Additionnal priority in case of equal time between
   *  two children. Higher priority means the entry will retrieved first.
   * @returns {Number} - Time of the first entry in the heap.
   */
  add(entry, time, priority = 0) {
    time = this.#sanitizeTime(time);

    entry[kQueueTime] = time;
    entry[kQueuePriority] = priority;
    // add the new entry at the end of the heap
    this.#heap[this.#currentLength] = entry;
    // bubble it up
    this.#bubbleUp(this.#currentLength);
    this.#currentLength += 1;

    return this.time;
  }

  /**
   * Move a given entry to a new position.
   * @param {Object} entry - Entry to move.
   * @param {Number} time - Time of the entry.
   * @return {Number} - Time of first entry in the heap.
   */
  move(entry, time) {
    const index = this.#heap.indexOf(entry);

    if (index !== -1) {
      entry[kQueueTime] = this.#sanitizeTime(time);
      // define if the entry should be bubbled up or down
      const parent = this.#heap[Math.floor(index / 2)];

      if (parent && this.#isHigher(entry, parent)) {
        this.#bubbleUp(index);
      } else {
        this.#bubbleDown(index);
      }
    }

    return this.time;
  }

  /**
   * Remove an entry from the heap and fix the heap.
   * @param {Object} entry - Entry to remove.
   * @return {Number} - Time of first entry in the heap.
   */
  remove(entry) {
    // find the index of the entry
    const index = this.#heap.indexOf(entry);

    if (index !== -1) {
      const lastIndex = this.#currentLength - 1;

      // if the entry is the last one
      if (index === lastIndex) {
        // remove the element from heap
        this.#heap[lastIndex] = undefined;
      } else {
        // swap with the last element of the heap
        swap(this.#heap, index, lastIndex);
        // remove the element from heap
        this.#heap[lastIndex] = undefined;

        if (index === 1) {
          this.#bubbleDown(1);
        } else {
          // bubble the (ex last) element up or down according to its new context
          const entry = this.#heap[index];
          const parent = this.#heap[Math.floor(index / 2)];

          if (parent && this.#isHigher(entry, parent)) {
            this.#bubbleUp(index);
          } else {
            this.#bubbleDown(index);
          }
        }
      }

      // delete symbol key
      delete entry[kQueueTime];
      delete entry[kQueuePriority];
      // update current length
      this.#currentLength = lastIndex;
    }

    return this.time;
  }

  /**
   * Clear the queue.
   */
  clear() {
    // clear symbol from each entry
    for (let i = 1; i < this.#currentLength; i++) {
      delete this.#heap[i][kQueueTime];
      delete this.#heap[i][kQueuePriority];
    }

    this.#currentLength = 1;
    this.#heap = new Array(this.#heap.length);
  }

  /**
   * Defines if the queue contains the given `entry`.
   *
   * @param {Object} entry - Entry to be checked
   * @return {Boolean}
   */
  has(entry) {
    return this.#heap.includes(entry);
  }
}

export default PriorityQueue;
