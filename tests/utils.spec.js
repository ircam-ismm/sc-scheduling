import { assert } from 'chai';

import { quantize } from '../src/utils.js';

describe('# quantize(value, precision = 1e-9)', () => {
  it('test #1', () => {
    // should be 1.09, but is 1.0899999999999999
    const a = 0.97 + 0.12
    assert.notEqual(a, 1.09);
    assert.equal(quantize(a), 1.09);
  });

  // this fails
  // it.only('test #2', () => {
  //   // before 0.005307370001000001
  //   // after 0.0053073700000000005
  //   const a = 0.005307370001000001;
  //   assert.equal(quantize(a), 0.00530737);
  // });

  // this is wrong too
  // it.only(`test #3`, () => {
  //   for (let i = 0; i < 1e6; i++) {
  //     const rand = Math.random() * 1000;
  //     const quantized = quantize(rand);

  //     assert.isAtLeast(quantized, rand);
  //   }
  // });
});
