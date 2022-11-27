
// quantify at 1e-9 (this is very subsample accurante...)
// minimize some floating point weirdness that may happen
export function quantize(val) {
  val = Math.round(val * 1e9) * 1e-9;
  return parseFloat(val.toFixed(9));
}
