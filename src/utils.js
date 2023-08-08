// quantify at 1e-9 (this is very subsample accurante...)
// minimize some floating point weirdness that may happen, e.g.
//
// 0.97 + 0.12
// > 1.0899999999999999
// Math.round((0.97 + 0.12) * 1e9) * 1e-9
// 1.09
//
// note that one sample duration is ~20µs (1 / 48000 = 0.00002083333)
// so with a default precision of 1e-9 we quantize a sample with 20000 points
// which is probably safe enough...
//
// this does not work in all cases (see tests), e.g.:
// - before 0.005307370001000001
// - after 0.0053073700000000005
// but the issues/problems we have seen so
// far are when we are around a integer, with a value just below causing infinite loops
// -> was maybe an implementation issue...
// let's confirm we want to keep this

export function quantize(val, precision = 1e-9) {
  return Math.round(val / precision) * precision;
}

export const identity = t => t;

// symbols
export const priorityQueueTime = Symbol.for('sc-scheduling:queue-time');
export const schedulerInstance = Symbol.for('sc-scheduling:scheduler');
// for backward compatibility with waves engines
export const schedulerCompatMode = Symbol.for('sc-scheduling:compat-mode');
