// quantify at 1e-9 (this is very subsample accurante...)
// minimize some floating point weirdness that may happen

// note that one sample duration is ~20µs (1 / 48000 = 0.00002083333)
// so with a default precision of 1e-9 we quantize a sample with 20000 points
// which is probably safe enough...

// 0.97 + 0.12
// > 1.0899999999999999
// Math.round((0.97 + 0.12) * 1e9) * 1e-9
// 1.09

export function quantize(val, precision = 1e-9) {
  return Math.round(val / precision) * precision;
}

export const identity = t => t;

// symbols
export const schedulerKey = Symbol.for('sc-scheduling:scheduler');
export const priorityQueueTimeKey = Symbol.for('sc-scheduling:queue-time');
