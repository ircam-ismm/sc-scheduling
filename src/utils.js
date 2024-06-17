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

// positive point, it garantees we don't have a value that is smaller than expected
// in particular when we have several convertion, e.g.
// > 1.1 + 0.1
// > 1.1999999999999997

// in any case this needs to be dig more consistently...

export function quantize(val, precision = 1e-9) {
  return Math.round(val / precision) * precision;
}

export function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export const identity = t => t;

export function isPositiveNumber(value) {
  return Number.isFinite(value) && value >= 0;
}
