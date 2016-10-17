import * as test from 'blue-tape';

import File = require('vinyl');

test('File', (t) => {

  t.test('isVinyl()', (t) => {

    t.test('returns true for a Vinyl object', (t) => {
      t.plan(1);
      var file = new File();
      var result = File.isVinyl(file);
      t.equal(result, true);
    });

    t.end();
  });

  t.end();
});
