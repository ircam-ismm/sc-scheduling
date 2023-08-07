import { assert } from 'chai';

import { quantize } from '../src/utils.js';

describe('# quantize(value, precision = 1e-9)', () => {
  it('should quantize given value', () => {
    const a = 0.97 + 0.12
    // should be 1.09, but we have a floating point error
    // this give 1.0899999999999999
    assert.notEqual(a, 1.09);
    assert.equal(quantize(a), 1.09);
  });
});
