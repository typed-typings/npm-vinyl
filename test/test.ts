import * as test from 'blue-tape';

import File = require('vinyl');

test('File', (t) => {
  t.plan(1);
  t.notEqual(File, null);
});
