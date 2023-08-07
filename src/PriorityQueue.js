//
const queueTimeKey = Symbol.for('sc-scheduling-queue-time');

// works by reference
function swap(arr, i1, i2) {
  const tmp = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = tmp;
}

/**
 * Define if `time1` should be lower in the topography than `time2`.
 * Is dynamically affected to the priority queue according to handle `min` and `max` heap.
 *
 * @private
 * @param {Number} time1
 * @param {Number} time2
 * @return {Boolean}
 */
const _isLowerMaxHeap = function(time1, time2) {
  return time1 < time2;
};

const _isLowerMinHeap = function(time1, time2) {
  return time1 > time2;
};

/**
 * Define if `time1` should be higher in the topography than `time2`.
 * Is dynamically affected to the priority queue according to handle `min` and `max` heap.
 *
 * @private
 * @param {Number} time1
 * @param {Number} time2
 * @return {Boolean}
 */
const _isHigherMaxHeap = function(time1, time2) {
  return time1 > time2;
};

const _isHigherMinHeap = function(time1, time2) {
  return time1 < time2;
};

/**
 * @private
 *
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
 */
class PriorityQueue {
  constructor(heapLength = 1000) {
    /**
     * Pointer to the first empty index of the heap.
     * @type {Number}
     * @private
     */
    this._currentLength = 1;

    /**
     * Array of the sorted indexes of the entries, the actual heap. Ignore the index 0.
     * @type {Array}
     * @private
     */
    this._heap = new Array(heapLength + 1);

    /**
     * Type of the queue: `min` heap if `false`, `max` heap if `true`
     * @type {Boolean}
     * @private
     */
    this._reverse = null;

    // initialize compare functions
    this.reverse = false;
  }

  /**
   * Time of the first element in the binary heap. Returns Infinity if no object
   * registered in the queue yet.
   * @readonly
   * @returns {Number}
   */
  get time() {
    if (this._currentLength > 1) {
      return this._heap[1][queueTimeKey];
    }

    return Infinity;
  }

  /**
   * First element in the binary heap.
   * @readonly
   * @returns {Number}
   */
  get head() {
    return this._heap[1];
  }

  /**
   * Change the order of the queue: min heap if false (default), max heap if true.
   * The rebuilds the head with the existing entries.
   * @type {Boolean}
   */
  set reverse(value) {
    if (value !== this._reverse) {
      this._reverse = value;

      if (this._reverse === true) {
        this._isLower = _isLowerMaxHeap;
        this._isHigher = _isHigherMaxHeap;
      } else {
        this._isLower = _isLowerMinHeap;
        this._isHigher = _isHigherMinHeap;
      }

      this._buildHeap();
    }
  }

  /**
   * Order of the heap: false means min heap (default), true means max heap.
  get reverse() {
    return this._reverse;
  }

  /**
   * Fix the heap by moving an entry to a new upper position.
   * @private
   * @param {Number} startIndex - The index of the entry to move.
   */
  _bubbleUp(startIndex) {
    let entry = this._heap[startIndex];

    let index = startIndex;
    let parentIndex = Math.floor(index / 2);
    let parent = this._heap[parentIndex];

    while (parent && this._isHigher(entry[queueTimeKey], parent[queueTimeKey])) {
      swap(this._heap, index, parentIndex);

      index = parentIndex;
      parentIndex = Math.floor(index / 2);
      parent = this._heap[parentIndex];
    }
  }

  /**
   * Fix the heap by moving an entry to a new lower position.
   * @private
   * @param {Number} startIndex - The index of the entry to move.
   */
  _bubbleDown(startIndex) {
    let entry = this._heap[startIndex];

    let index = startIndex;
    let c1index = index * 2;
    let c2index = c1index + 1;
    let child1 = this._heap[c1index];
    let child2 = this._heap[c2index];

    while ((child1 && this._isLower(entry[queueTimeKey], child1[queueTimeKey])) ||
           (child2 && this._isLower(entry[queueTimeKey], child2[queueTimeKey])))
    {
      // swap with the minimum child
      let targetIndex;

      if (child2)
        targetIndex = this._isHigher(child1[queueTimeKey], child2[queueTimeKey]) ? c1index : c2index;
      else
        targetIndex = c1index;

      swap(this._heap, index, targetIndex);

      // update to find next children
      index = targetIndex;
      c1index = index * 2;
      c2index = c1index + 1;
      child1 = this._heap[c1index];
      child2 = this._heap[c2index];
    }
  }

  /**
   * Build the heap (from bottom up).
   */
  _buildHeap() {
    // find the index of the last internal node
    let maxIndex = Math.floor((this._currentLength - 1) / 2);

    for (let i = maxIndex; i > 0; i--) {
      this._bubbleDown(i);
    }
  }

  /**
   * Insert a new object in the binary heap and sort it.
   *
   * @param {Object} entry - Entry to insert.
   * @param {Number} time - Time at which the entry should be orderer.
   * @returns {Number} - Time of the first entry in the heap.
   */
  insert(entry, time) {
    // ±Infinity should always be at the end of the queue, disregarding its sign.
    // Using Number.isFinite also allows us to handle NaN gracefully
    if (!Number.isFinite(time)) {
      if (Math.abs(time) !== Infinity) {
        console.warn(`PriorityQueue: entry`, entry, `inserted with NaN time: "${time}" (overriden to Infinity). This probably shows an error in your implementation.`);
      }

      time = this.reverse ? -Infinity : Infinity;
    }

    entry[queueTimeKey] = time;
    // add the new entry at the end of the heap
    this._heap[this._currentLength] = entry;
    // bubble it up
    this._bubbleUp(this._currentLength);
    this._currentLength += 1;

    return this.time;
  }

  /**
   * Move a given entry to a new position.
   * @param {Object} entry - Entry to move.
   * @param {Number} time - Time of the entry.
   * @return {Number} - Time of first entry in the heap.
   */
  move(entry, time) {
    const index = this._heap.indexOf(entry);

    if (index !== -1) {
      entry[queueTimeKey] = time;
      // define if the entry should be bubbled up or down
      const parent = this._heap[Math.floor(index / 2)];

      if (parent && this._isHigher(time, parent[queueTimeKey]))
        this._bubbleUp(index);
      else
        this._bubbleDown(index);
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
    const index = this._heap.indexOf(entry);

    if (index !== -1) {
      const lastIndex = this._currentLength - 1;

      // if the entry is the last one
      if (index === lastIndex) {
        // remove the element from heap
        this._heap[lastIndex] = undefined;
        // update current length
        this._currentLength = lastIndex;

        return this.time;
      } else {
        // swap with the last element of the heap
        swap(this._heap, index, lastIndex);
        // remove the element from heap
        this._heap[lastIndex] = undefined;

        if (index === 1) {
          this._bubbleDown(1);
        } else {
          // bubble the (ex last) element up or down according to its new context
          const entry = this._heap[index];
          const parent = this._heap[Math.floor(index / 2)];

          if (parent && this._isHigher(entry[queueTimeKey], parent[queueTimeKey]))
            this._bubbleUp(index);
          else
            this._bubbleDown(index);
        }
      }

      // update current length
      this._currentLength = lastIndex;
    }

    return this.time;
  }

  /**
   * Clear the queue.
   */
  clear() {
    this._currentLength = 1;
    this._heap = new Array(this._heap.length);
  }

  /**
   * Defines if the queue contains the given `entry`.
   *
   * @param {Object} entry - Entry to be checked
   * @return {Boolean}
   */
  has(entry) {
    return this._heap.includes(entry);
  }
}

export default PriorityQueue;
