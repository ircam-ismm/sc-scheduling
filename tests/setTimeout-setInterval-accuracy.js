import { getTime } from '@ircam/sc-gettime';
import { delay } from '@ircam/sc-utils';

console.log('');
console.log('# test setTimeout for different delay times:');
console.log('');

for (let i = 0; i < 50; i++) {
  // should have no promise overhead as everything is made inside it
  await new Promise(resolve => {
    const startTime = getTime() * 1000;

    setTimeout(() => {
      const dt = getTime() * 1000 - startTime;
      const err = dt - i;

      console.log(`i: ${i} - dt: ${dt.toFixed(3)}ms - err: ${err.toFixed(3)}ms`);

      resolve();
    }, i);
  });

  // wait a bit between each test
  await delay(100);
}

console.log('');
console.log('# test setInterval for different delay times:');
console.log('');

for (let i = 0; i < 50; i++) {
  // should have no promise overhead as everything is made inside it
  await new Promise(resolve => {
    const startTime = getTime() * 1000;

    let id = setInterval(() => {
      const dt = getTime() * 1000 - startTime;
      const err = dt - i;

      console.log(`i: ${i} - dt: ${dt.toFixed(3)}ms - err: ${err.toFixed(3)}ms`);

      clearInterval(id);
      resolve();
    }, i);
  });

  // wait a bit between each test
  await delay(100);
}


// console.log('coucou');
// setInterval(() => console.log('beap'), 1000);
