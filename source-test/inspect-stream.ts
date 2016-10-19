import * as stream from 'stream';
import expect = require('expect');
import Cloneable = require('cloneable-readable');

import inspectStream = require('../lib/inspect-stream');

describe('inspectStream()', function() {

  it('works on a Stream', function(done) {
    const testStream = new stream.Stream();
    const result = inspectStream(testStream);
    expect(result).toEqual('<Stream>');
    done();
  });

  it('works on a Readable Stream', function(done) {
    const testStream = new stream.Readable();
    const result = inspectStream(testStream);
    expect(result).toEqual('<ReadableStream>');
    done();
  });

  it('works on a Writable Stream', function(done) {
    const testStream = new stream.Writable();
    const result = inspectStream(testStream);
    expect(result).toEqual('<WritableStream>');
    done();
  });

  it('works on a Duplex Stream', function(done) {
    const testStream = new stream.Duplex();
    const result = inspectStream(testStream);
    expect(result).toEqual('<DuplexStream>');
    done();
  });

  it('works on a Transform Stream', function(done) {
    const testStream = new stream.Transform();
    const result = inspectStream(testStream);
    expect(result).toEqual('<TransformStream>');
    done();
  });

  it('works on a PassThrough Stream', function(done) {
    const testStream = new stream.PassThrough();
    const result = inspectStream(testStream);
    expect(result).toEqual('<PassThroughStream>');
    done();
  });

  it('works on a custom Stream', function(done) {
    const testStream = new Cloneable(new stream.Readable());
    const result = inspectStream(testStream);
    expect(result).toEqual('<CloneableStream>');
    done();
  });

  it('returns nothing for a Buffer', function(done) {
    const testBuffer = new Buffer('test');
    const result = inspectStream(testBuffer);
    expect(result).toNotExist();
    done();
  });

  it('returns nothing for null', function(done) {
    const result = inspectStream(null);
    expect(result).toNotExist();
    done();
  });

  it('returns nothing for a String', function(done) {
    const result = inspectStream('foobar');
    expect(result).toNotExist();
    done();
  });
});
