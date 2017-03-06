import * as path from 'path';
import expect = require('expect');

import normalize = require('../lib/normalize');

describe('normalize()', function() {

  it('leaves empty strings unmodified', function(done: MochaDone) {
    const result = normalize('');
    expect(result).toEqual('');
    done();
  });

  it('applies path.normalize for everything else', function(done: MochaDone) {
    const str = '/foo//../bar/baz';
    const result = normalize(str);
    expect(result).toEqual(path.normalize(str));
    done();
  });
});
