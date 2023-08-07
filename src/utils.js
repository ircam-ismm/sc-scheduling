// quantify at 1e-9 (this is very subsample accurante...)
// minimize some floating point weirdness that may happen

// 0.97 + 0.12
// > 1.0899999999999999
// Math.round((0.97 + 0.12) * 1e9) * 1e-9
// 1.09

export function quantize(val, precision = 1e-9) {
  return Math.round(val / precision) * precision;
}
