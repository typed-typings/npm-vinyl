import * as fs from 'fs';
import * as path from 'path';
import expect = require('expect');

import miss = require('mississippi');
import cloneable = require('cloneable-readable');

import Vinyl = require('../index');


const pipe = <any> miss.pipe;
const from = <any> miss.from;
const concat = <any> miss.concat;
const isCloneable = <(obj: any) => boolean> (<any> cloneable).isCloneable;

const isWin = process.platform === 'win32';

describe('File', function () {

  describe('isVinyl()', function () {

    it('returns true for a Vinyl object', function (done: MochaDone) {
      const file = new Vinyl();
      const result = Vinyl.isVinyl(file);
      expect(result).toEqual(true);
      done();
    });

    it('returns false for a normal object', function (done: MochaDone) {
      const result = Vinyl.isVinyl({});
      expect(result).toEqual(false);
      done();
    });

    it('returns false for null', function (done: MochaDone) {
      const result = Vinyl.isVinyl(null);
      expect(result).toEqual(false);
      done();
    });

    it('returns false for a string', function (done: MochaDone) {
      const result = Vinyl.isVinyl('foobar');
      expect(result).toEqual(false);
      done();
    });

    it('returns false for a String object', function (done: MochaDone) {
      const result = Vinyl.isVinyl(new String('foobar'));
      expect(result).toEqual(false);
      done();
    });

    it('returns false for a number', function (done: MochaDone) {
      const result = Vinyl.isVinyl(1);
      expect(result).toEqual(false);
      done();
    });

    it('returns false for a Number object', function (done: MochaDone) {
      const result = Vinyl.isVinyl(new Number(1));
      expect(result).toEqual(false);
      done();
    });

    // This is based on current implementation
    // A test was added to document and make aware during internal changes
    // TODO: decide if this should be leak-able
    it('returns true for a mocked object', function (done: MochaDone) {
      const result = Vinyl.isVinyl({_isVinyl: true});
      expect(result).toEqual(true);
      done();
    });
  });

  describe('defaults', function () {

    it('defaults cwd to process.cwd', function (done: MochaDone) {
      const file = new Vinyl();
      expect(file.cwd).toEqual(process.cwd());
      done();
    });

    it('defaults base to process.cwd', function (done: MochaDone) {
      const file = new Vinyl();
      expect(file.base).toEqual(process.cwd());
      done();
    });

    it('defaults base to cwd property', function (done: MochaDone) {
      const cwd = path.normalize('/');
      const file = new Vinyl({cwd: cwd});
      expect(file.base).toEqual(cwd);
      done();
    });

    it('defaults path to null', function (done: MochaDone) {
      const file = new Vinyl();
      expect(file.path).toNotExist();
      expect(file.path).toEqual(null);
      done();
    });

    it('defaults history to an empty array', function (done: MochaDone) {
      const file = new Vinyl();
      expect(file.history).toEqual([]);
      done();
    });

    it('defaults stat to null', function (done: MochaDone) {
      const file = new Vinyl();
      expect(file.stat).toNotExist();
      expect(file.stat).toEqual(null);
      done();
    });

    it('defaults contents to null', function (done: MochaDone) {
      const file = new Vinyl();
      expect(file.contents).toNotExist();
      expect(file.contents).toEqual(null);
      done();
    });
  });

  describe('constructor()', function () {

    it('sets base', function (done: MochaDone) {
      const val = path.normalize('/');
      const file = new Vinyl({base: val});
      expect(file.base).toEqual(val);
      done();
    });

    it('sets cwd', function (done: MochaDone) {
      const val = path.normalize('/');
      const file = new Vinyl({cwd: val});
      expect(file.cwd).toEqual(val);
      done();
    });

    it('sets path (and history)', function (done: MochaDone) {
      const val = path.normalize('/test.coffee');
      const file = new Vinyl({path: val});
      expect(file.path).toEqual(val);
      expect(file.history).toEqual([val]);
      done();
    });

    it('sets history (and path)', function (done: MochaDone) {
      const val = path.normalize('/test.coffee');
      const file = new Vinyl({history: [val]});
      expect(file.path).toEqual(val);
      expect(file.history).toEqual([val]);
      done();
    });

    it('sets stat', function (done: MochaDone) {
      const val: any = {};
      const file = new Vinyl({stat: val});
      expect(file.stat).toEqual(val);
      done();
    });

    it('sets contents', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl({contents: val});
      expect(file.contents).toEqual(val);
      done();
    });

    it('sets custom properties', function (done: MochaDone) {
      const sourceMap = {};
      const file = <Vinyl & {sourceMap: {}}> new Vinyl(<any> {sourceMap: sourceMap});
      expect(file.sourceMap).toEqual(sourceMap);
      done();
    });

    it('normalizes path', function (done: MochaDone) {
      const val = '/test/foo/../test.coffee';
      const expected = path.normalize(val);
      const file = new Vinyl({path: val});
      expect(file.path).toEqual(expected);
      expect(file.history).toEqual([expected]);
      done();
    });

    it('normalizes and removes trailing separator from path', function (done: MochaDone) {
      const val = '/test/foo/../foo/';
      const expected = path.normalize(val.slice(0, -1));
      const file = new Vinyl({path: val});
      expect(file.path).toEqual(expected);
      done();
    });

    it('normalizes history', function (done: MochaDone) {
      const val = [
        '/test/bar/../bar/test.coffee',
        '/test/foo/../test.coffee',
      ];
      const expected = val.map((p) => {
        return path.normalize(p);
      });
      const file = new Vinyl({history: val});
      expect(file.path).toEqual(expected[1]);
      expect(file.history).toEqual(expected);
      done();
    });

    it('normalizes and removes trailing separator from history', function (done: MochaDone) {
      const val = [
        '/test/foo/../foo/',
        '/test/bar/../bar/',
      ];
      const expected = val.map((p) => {
        return path.normalize(p.slice(0, -1));
      });
      const file = new Vinyl({history: val});
      expect(file.history).toEqual(expected);
      done();
    });

    it('appends path to history if both exist and different from last', function (done: MochaDone) {
      const val = path.normalize('/test/baz/test.coffee');
      const history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
      ];
      const file = new Vinyl({path: val, history: history});

      const expectedHistory = history.concat(val);

      expect(file.path).toEqual(val);
      expect(file.history).toEqual(expectedHistory);
      done();
    });

    it('does not append path to history if both exist and same as last', function (done: MochaDone) {
      const val = path.normalize('/test/baz/test.coffee');
      const history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
        val,
      ];
      const file = new Vinyl({path: val, history: history});

      expect(file.path).toEqual(val);
      expect(file.history).toEqual(history);
      done();
    });

    it('does not mutate history array passed in', function (done: MochaDone) {
      const val = path.normalize('/test/baz/test.coffee');
      const history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
      ];
      const historyCopy = Array.prototype.slice.call(history);
      const file = new Vinyl({path: val, history: history});

      const expectedHistory = history.concat(val);

      expect(file.path).toEqual(val);
      expect(file.history).toEqual(expectedHistory);
      expect(history).toEqual(historyCopy);
      done();
    });
  });

  describe('isBuffer()', function () {

    it('returns true when the contents are a Buffer', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl({contents: val});
      expect(file.isBuffer()).toEqual(true);
      done();
    });

    it('returns false when the contents are a Stream', function (done: MochaDone) {
      const val = from([]);
      const file = new Vinyl({contents: val});
      expect(file.isBuffer()).toEqual(false);
      done();
    });

    it('returns false when the contents are null', function (done: MochaDone) {
      const file = new Vinyl({contents: null});
      expect(file.isBuffer()).toEqual(false);
      done();
    });
  });

  describe('isStream()', function () {

    it('returns false when the contents are a Buffer', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl({contents: val});
      expect(file.isStream()).toEqual(false);
      done();
    });

    it('returns true when the contents are a Stream', function (done: MochaDone) {
      const val = from([]);
      const file = new Vinyl({contents: val});
      expect(file.isStream()).toEqual(true);
      done();
    });

    it('returns false when the contents are null', function (done: MochaDone) {
      const file = new Vinyl({contents: null});
      expect(file.isStream()).toEqual(false);
      done();
    });
  });

  describe('isNull()', function () {

    it('returns false when the contents are a Buffer', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl({contents: val});
      expect(file.isNull()).toEqual(false);
      done();
    });

    it('returns false when the contents are a Stream', function (done: MochaDone) {
      const val = from([]);
      const file = new Vinyl({contents: val});
      expect(file.isNull()).toEqual(false);
      done();
    });

    it('returns true when the contents are null', function (done: MochaDone) {
      const file = new Vinyl({contents: null});
      expect(file.isNull()).toEqual(true);
      done();
    });
  });

  describe('isDirectory()', function () {
    const fakeStat: fs.Stats = new fs.Stats();
    fakeStat.isDirectory = (): boolean => true;

    it('returns false when the contents are a Buffer', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl({contents: val, stat: fakeStat});
      expect(file.isDirectory()).toEqual(false);
      done();
    });

    it('returns false when the contents are a Stream', function (done: MochaDone) {
      const val = from([]);
      const file = new Vinyl({contents: val, stat: fakeStat});
      expect(file.isDirectory()).toEqual(false);
      done();
    });

    it('returns true when the contents are null & stat.isDirectory is true', function (done: MochaDone) {
      const file = new Vinyl({contents: null, stat: fakeStat});
      expect(file.isDirectory()).toEqual(true);
      done();
    });

    it('returns false when stat exists but does not contain an isDirectory method', function (done: MochaDone) {
      const file = new Vinyl({contents: null, stat: new fs.Stats()});
      expect(file.isDirectory()).toEqual(false);
      done();
    });

    it('returns false when stat does not exist', function (done: MochaDone) {
      const file = new Vinyl({contents: null});
      expect(file.isDirectory()).toEqual(false);
      done();
    });
  });

  describe('isSymbolic()', function () {
    const fakeStat: fs.Stats = new fs.Stats();
    fakeStat.isSymbolicLink = (): boolean => true;

    it('returns false when the contents are a Buffer', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl({contents: val, stat: fakeStat});
      expect(file.isSymbolic()).toEqual(false);
      done();
    });

    it('returns false when the contents are a Stream', function (done: MochaDone) {
      const val = from([]);
      const file = new Vinyl({contents: val, stat: fakeStat});
      expect(file.isSymbolic()).toEqual(false);
      done();
    });

    it('returns true when the contents are null & stat.isSymbolicLink is true', function (done: MochaDone) {
      const file = new Vinyl({contents: null, stat: fakeStat});
      expect(file.isSymbolic()).toEqual(true);
      done();
    });

    it('returns false when stat exists but does not contain an isSymbolicLink method', function (done: MochaDone) {
      const file = new Vinyl({contents: null, stat: new fs.Stats()});
      expect(file.isSymbolic()).toEqual(false);
      done();
    });

    it('returns false when stat does not exist', function (done: MochaDone) {
      const file = new Vinyl({contents: null});
      expect(file.isSymbolic()).toEqual(false);
      done();
    });
  });

  describe('clone()', function () {

    it('copies all attributes over with Buffer contents', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Buffer('test'),
      };
      const file = new Vinyl(options);
      const file2 = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.cwd).toEqual(file.cwd);
      expect(file2.base).toEqual(file.base);
      expect(file2.path).toEqual(file.path);
      expect(file2.contents).toNotBe(file.contents);
      (expect(file2.contents) as expect.IObjectExpectation<Buffer | NodeJS.ReadableStream>).toBeA(Buffer);
      (expect(file2.contents) as expect.IObjectExpectation<Buffer | NodeJS.ReadableStream>).toBeA(Buffer);
      expect((<Buffer> file2.contents).toString('utf8')).toEqual((<Buffer> file.contents).toString('utf8'));
      done();
    });

    it('assigns Buffer content reference when contents option is false', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test'),
      };
      const file = new Vinyl(options);

      const copy1 = file.clone({contents: false});
      expect(copy1.contents).toBe(file.contents);

      const copy2 = file.clone();
      expect(copy2.contents).toNotBe(file.contents);

      const copy3 = file.clone({contents: <any> 'invalid'});
      expect(copy3.contents).toNotBe(file.contents);
      done();
    });

    it('copies all attributes over with Stream contents', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup']),
      };
      const file = new Vinyl(options);
      const file2 = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.cwd).toEqual(file.cwd);
      expect(file2.base).toEqual(file.base);
      expect(file2.path).toEqual(file.path);
      expect(file2.contents).toNotBe(file.contents);

      let ends = 2;
      let data: Buffer | null = null;
      let data2: Buffer | null = null;

      function assert(err: Error) {
        if (err) {
          done(err);
          return;
        }

        if (--ends === 0) {
          expect(data).toNotBe(data2);
          expect(data).toNotBe(null);
          expect(data2).toNotBe(null);
          expect((<Buffer> data).toString('utf8')).toEqual((<Buffer> data2).toString('utf8'));
          done();
        }
      }

      pipe([
        file.contents,
        concat((d: Buffer) => {
          data = d;
        }),
      ], assert);

      pipe([
        file2.contents,
        concat((d: Buffer) => {
          data2 = d;
        }),
      ], assert);
    });

    it('does not start flowing until all clones flows (data)', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup']),
      };
      const file = new Vinyl(options);
      const file2 = file.clone();
      let ends = 2;

      let data = '';
      let data2 = '';

      function assert() {
        if (--ends === 0) {
          expect(data).toEqual(data2);
          done();
        }
      }

      // Start flowing file2
      (<NodeJS.ReadableStream> file2.contents).on('data', (chunk: Buffer) => {
        data2 += chunk.toString('utf8');
      });

      process.nextTick(function () {
        // Nothing was written yet
        expect(data).toEqual('');
        expect(data2).toEqual('');

        // Starts flowing file
        (<NodeJS.ReadableStream> file.contents).on('data', (chunk: Buffer) => {
          data += chunk.toString('utf8');
        });
      });

      (<NodeJS.ReadableStream> file2.contents).on('end', assert);
      (<NodeJS.ReadableStream> file.contents).on('end', assert);
    });

    it('does not start flowing until all clones flows (readable)', (done: MochaDone) => {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup']),
      };
      const file = new Vinyl(options);
      const file2 = file.clone();

      let data2 = '';

      function assert(data: Buffer) {
        expect(data.toString('utf8')).toEqual(data2);
      }

      // Start flowing file2
      (<NodeJS.ReadableStream> file2.contents).on('readable', () => {
        let chunk: Buffer;
        while ((chunk = this.read()) !== null) {
          data2 += chunk.toString();
        }
      });

      pipe([
        file.contents,
        concat(assert),
      ], done);
    });

    it('copies all attributes over with null contents', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      };
      const file = new Vinyl(options);
      const file2 = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.cwd).toEqual(file.cwd);
      expect(file2.base).toEqual(file.base);
      expect(file2.path).toEqual(file.path);
      expect(file2.contents).toNotExist();
      done();
    });

    it('properly clones the `stat` property', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test'),
        stat: fs.statSync(__filename),
      };

      const file = new Vinyl(options);
      const copy = file.clone();

      expect(copy.stat).toNotBe(null);
      expect((<fs.Stats> copy.stat).isFile()).toEqual(true);
      expect((<fs.Stats> copy.stat).isDirectory()).toEqual(false);
      (expect(file.stat) as expect.IObjectExpectation<fs.Stats>).toBeA(fs.Stats);
      (expect(copy.stat) as expect.IObjectExpectation<fs.Stats>).toBeA(fs.Stats);
      done();
    });

    it('properly clones the `history` property', function (done: MochaDone) {
      const options = {
        cwd: path.normalize('/'),
        base: path.normalize('/test/'),
        path: path.normalize('/test/test.js'),
        contents: new Buffer('test'),
      };

      const file = new Vinyl(options);
      const copy = file.clone();

      expect(copy.history[0]).toEqual(options.path);
      copy.path = 'lol';
      expect(file.path).toNotEqual(copy.path);
      done();
    });

    it('copies custom properties', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
        custom: {meta: {}},
      };

      const file: Vinyl & {custom: {meta: {}}} = <any> new Vinyl(options);
      const file2: Vinyl & {custom: {meta: {}}} = <any> file.clone();

      expect(file2).toNotBe(file);
      expect(file2.cwd).toEqual(file.cwd);
      expect(file2.base).toEqual(file.base);
      expect(file2.path).toEqual(file.path);
      expect(file2.custom).toNotBe(file.custom);
      expect(file2.custom.meta).toNotBe(file.custom.meta);
      expect(file2.custom).toEqual(file.custom);
      done();
    });

    it('copies history', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      };
      const history = [
        path.normalize('/test/test.coffee'),
        path.normalize('/test/test.js'),
        path.normalize('/test/test-938di2s.js'),
      ];

      const file = new Vinyl(options);
      file.path = history[1];
      file.path = history[2];
      const file2 = file.clone();

      expect(file2.history).toEqual(history);
      expect(file2.history).toNotBe(file.history);
      expect(file2.path).toEqual(history[2]);
      done();
    });

    it('supports deep & shallow copy of all attributes', function (done: MochaDone) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
        custom: {meta: {}},
      };

      const file: Vinyl & {custom: {meta: {}}} = <any> new Vinyl(options);

      const file2: Vinyl & {custom: {meta: {}}} = <any> file.clone();
      expect(file2.custom).toEqual(file.custom);
      expect(file2.custom).toNotBe(file.custom);
      expect(file2.custom.meta).toEqual(file.custom.meta);
      expect(file2.custom.meta).toNotBe(file.custom.meta);

      const file3: Vinyl & {custom: {meta: {}}} = <any> file.clone(true);
      expect(file3.custom).toEqual(file.custom);
      expect(file3.custom).toNotBe(file.custom);
      expect(file3.custom.meta).toEqual(file.custom.meta);
      expect(file3.custom.meta).toNotBe(file.custom.meta);

      const file4: Vinyl & {custom: {meta: {}}} = <any> file.clone({deep: true});
      expect(file4.custom).toEqual(file.custom);
      expect(file4.custom).toNotBe(file.custom);
      expect(file4.custom.meta).toEqual(file.custom.meta);
      expect(file4.custom.meta).toNotBe(file.custom.meta);

      const file5: Vinyl & {custom: {meta: {}}} = <any> file.clone(false);
      expect(file5.custom).toEqual(file.custom);
      expect(file5.custom).toBe(file.custom);
      expect(file5.custom.meta).toEqual(file.custom.meta);
      expect(file5.custom.meta).toBe(file.custom.meta);

      const file6: Vinyl & {custom: {meta: {}}} = <any> file.clone({deep: false});
      expect(file6.custom).toEqual(file.custom);
      expect(file6.custom).toBe(file.custom);
      expect(file6.custom.meta).toEqual(file.custom.meta);
      expect(file6.custom.meta).toBe(file.custom.meta);

      done();
    });

    it('supports inheritance', function (done: MochaDone) {
      class ExtendedFile extends Vinyl {
      }

      const file: ExtendedFile = new ExtendedFile();
      const file2: ExtendedFile = file.clone();

      expect(file2).toNotBe(file);
      expect(file2.constructor).toBe(ExtendedFile);
      expect(file2).toBeAn(ExtendedFile);
      expect(file2).toBeAn(Vinyl);
      expect(ExtendedFile.prototype.isPrototypeOf(file2)).toEqual(true);
      expect(Vinyl.prototype.isPrototypeOf(file2)).toEqual(true);
      done();
    });
  });

  describe('inspect()', function () {

    it('returns correct format when no contents and no path', function (done: MochaDone) {
      const file = new Vinyl();
      expect(file.inspect()).toEqual('<File >');
      done();
    });

    it('returns correct format when Buffer contents and no path', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl({contents: val});
      expect(file.inspect()).toEqual('<File <Buffer 74 65 73 74>>');
      done();
    });

    it('returns correct format when Buffer contents and relative path', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: val,
      });
      expect(file.inspect()).toEqual('<File "test.coffee" <Buffer 74 65 73 74>>');
      done();
    });

    it('returns correct format when Stream contents and relative path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from([]),
      });
      expect(file.inspect()).toEqual('<File "test.coffee" <CloneableStream>>');
      done();
    });

    it('returns correct format when null contents and relative path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
      });
      expect(file.inspect()).toEqual('<File "test.coffee">');
      done();
    });
  });

  describe('contents get/set', function () {

    it('returns _contents', function (done: MochaDone) {
      const val = new Buffer('test');
      const file: Vinyl & {_contents?: Buffer} = new Vinyl();
      file._contents = val;
      expect(file.contents).toEqual(val);
      done();
    });

    it('sets _contents', function (done: MochaDone) {
      const val = new Buffer('test');
      const file: Vinyl & {_contents?: Buffer} = new Vinyl();
      file.contents = val;
      expect(file._contents).toEqual(val);
      done();
    });

    it('sets a Buffer', function (done: MochaDone) {
      const val = new Buffer('test');
      const file = new Vinyl();
      file.contents = val;
      expect(file.contents).toEqual(val);
      done();
    });

    it('wraps Stream in Cloneable', function (done: MochaDone) {
      const val = from([]);
      const file = new Vinyl();
      file.contents = val;
      expect(isCloneable(file.contents)).toEqual(true);
      done();
    });

    it('does not double wrap a Cloneable', function (done: MochaDone) {
      const val = from([]);
      const clone = cloneable(val);
      const file = new Vinyl();
      file.contents = clone;
      expect((<typeof file.contents & {_original: any}> file.contents)._original).toBe(val);
      done();
    });

    it('sets null', function (done: MochaDone) {
      const val: Buffer | null = null;
      const file = new Vinyl();
      file.contents = val;
      expect<Buffer | null>(file.contents).toEqual(null);
      done();
    });

    it('does not set a string', function (done: MochaDone) {
      const val = 'test';
      const file = new Vinyl();

      function invalid() {
        file.contents = <any> val;
      }

      expect(invalid).toThrow();
      done();
    });
  });

  describe('cwd get/set', function () {

    it('returns _cwd', function (done: MochaDone) {
      const val = '/test';
      const file: Vinyl & {_cwd: string} = <any> new Vinyl();
      file._cwd = val;
      expect(file.cwd).toEqual(val);
      done();
    });

    it('sets _cwd', function (done: MochaDone) {
      const val = '/test';
      const file: Vinyl & {_cwd: string} = <any> new Vinyl();
      file.cwd = val;
      expect(file._cwd).toEqual(path.normalize(val));
      done();
    });

    it('normalizes and removes trailing separator on set', function (done: MochaDone) {
      const val = '/test/foo/../foo/';
      const expected = path.normalize(val.slice(0, -1));
      const file = new Vinyl();

      file.cwd = val;

      expect(file.cwd).toEqual(expected);

      const val2 = '\\test\\foo\\..\\foo\\';
      const expected2 = path.normalize(isWin ? val2.slice(0, -1) : val2);

      file.cwd = val2;

      expect(file.cwd).toEqual(expected2);
      done();
    });

    it('throws on set with invalid values', function (done: MochaDone) {
      const invalidValues = [
        '',
        null,
        undefined,
        true,
        false,
        0,
        Infinity,
        NaN,
        {},
        [],
      ];
      const file = new Vinyl();

      invalidValues.forEach(function (val) {
        function invalid() {
          file.cwd = <any> val;
        }

        expect(invalid).toThrow('cwd must be a non-empty string.');
      });

      done();
    });
  });

  describe('base get/set', function () {

    it('proxies cwd when omitted', function (done: MochaDone) {
      const file = new Vinyl({cwd: '/test'});
      expect(file.base).toEqual(file.cwd);
      done();
    });

    it('proxies cwd when same', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/test',
        base: '/test',
      });
      file.cwd = '/foo/';
      expect(file.base).toEqual(file.cwd);

      const file2 = new Vinyl({
        cwd: '/test',
      });
      file2.base = '/test/';
      file2.cwd = '/foo/';
      expect(file2.base).toEqual(file.cwd);
      done();
    });

    it('proxies to cwd when null or undefined', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/foo',
        base: '/bar',
      });
      expect(file.base).toNotEqual(file.cwd);
      file.base = null;
      expect(file.base).toEqual(<any> file.cwd);
      file.base = '/bar/';
      expect(file.base).toNotEqual(file.cwd);
      file.base = undefined;
      expect(file.base).toEqual(<any> file.cwd);
      done();
    });

    it('returns _base', function (done: MochaDone) {
      const val = '/test/';
      const file: Vinyl & {_base: string} = <any> new Vinyl();
      file._base = val;
      expect(file.base).toEqual(val);
      done();
    });

    it('sets _base', function (done: MochaDone) {
      const val = '/test/foo';
      const file: Vinyl & {_base: string} = <any> new Vinyl();
      file.base = val;
      expect(file._base).toEqual(path.normalize(val));
      done();
    });

    it('normalizes and removes trailing separator on set', function (done: MochaDone) {
      const val = '/test/foo/../foo/';
      const expected = path.normalize(val.slice(0, -1));
      const file = new Vinyl();

      file.base = val;

      expect(file.base).toEqual(expected);

      const val2 = '\\test\\foo\\..\\foo\\';
      const expected2 = path.normalize(isWin ? val2.slice(0, -1) : val2);

      file.base = val2;

      expect(file.base).toEqual(expected2);
      done();
    });

    it('throws on set with invalid values', function (done: MochaDone) {
      const invalidValues = [
        true,
        false,
        1,
        0,
        Infinity,
        NaN,
        '',
        {},
        [],
      ];
      const file = new Vinyl();

      invalidValues.forEach(function (val) {
        function invalid() {
          file.base = <any> val;
        }

        expect(invalid).toThrow('base must be a non-empty string, or null/undefined.');
      });

      done();
    });
  });

  describe('relative get/set', function () {

    it('throws on set', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.relative = 'test';
      }

      expect(invalid).toThrow('File.relative is generated from the base and path attributes. Do not modify it.');
      done();
    });

    it('throws on get with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.relative;
      }

      expect(invalid).toThrow('No path specified! Can not get relative.');
      done();
    });

    it('returns a relative path from base', function (done: MochaDone) {
      const file = new Vinyl({
        base: '/test/',
        path: '/test/test.coffee',
      });

      expect(file.relative).toEqual('test.coffee');
      done();
    });

    it('returns a relative path from cwd', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        path: '/test/test.coffee',
      });

      expect(file.relative).toEqual(path.normalize('test/test.coffee'));
      done();
    });

    it('does not append separator when directory', function (done: MochaDone) {
      const file = new Vinyl({
        base: '/test',
        path: '/test/foo/bar',
        stat: Object.assign(
          new fs.Stats(),
          {
            isDirectory: (): boolean => true
          }
        )
      });

      expect(file.relative).toEqual(path.normalize('foo/bar'));
      done();
    });

    it('does not append separator when symlink', function (done: MochaDone) {
      const file = new Vinyl({
        base: '/test',
        path: '/test/foo/bar',
        stat: Object.assign(
          new fs.Stats(),
          {
            isSymbolicLink: (): boolean => true
          }
        )
      });

      expect(file.relative).toEqual(path.normalize('foo/bar'));
      done();
    });

    it('does not append separator when directory & symlink', function (done: MochaDone) {
      const file = new Vinyl({
        base: '/test',
        path: '/test/foo/bar',
        stat: Object.assign(
          new fs.Stats(),
          {
            isDirectory: (): boolean => true,
            isSymbolicLink: (): boolean => true
          }
        )
      });

      expect(file.relative).toEqual(path.normalize('foo/bar'));
      done();
    });
  });

  describe('dirname get/set', function () {

    it('throws on get with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.dirname;
      }

      expect(invalid).toThrow('No path specified! Can not get dirname.');
      done();
    });

    it('returns the dirname without trailing separator', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test',
        path: '/test/test.coffee',
      });

      expect(file.dirname).toEqual(path.normalize('/test'));
      done();
    });

    it('throws on set with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.dirname = '/test';
      }

      expect(invalid).toThrow('No path specified! Can not set dirname.');
      done();
    });

    it('replaces the dirname of the path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });

      file.dirname = '/test/foo';
      expect(file.path).toEqual(path.normalize('/test/foo/test.coffee'));
      done();
    });
  });

  describe('basename get/set', function () {

    it('throws on get with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        const a = file.basename;
      }

      expect(invalid).toThrow('No path specified! Can not get basename.');
      done();
    });

    it('returns the basename of the path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });

      expect(file.basename).toEqual('test.coffee');
      done();
    });

    it('does not append trailing separator when directory', function (done: MochaDone) {
      const file = new Vinyl({
        path: '/test/foo',
        stat: Object.assign(
          new fs.Stats(),
          {
            isDirectory: (): boolean => true
          }
        )
      });

      expect(file.basename).toEqual('foo');
      done();
    });

    it('does not append trailing separator when symlink', function (done: MochaDone) {
      const file = new Vinyl({
        path: '/test/foo',
        stat: Object.assign(
          new fs.Stats(),
          {
            isSymbolicLink: (): boolean => true
          }
        )
      });

      expect(file.basename).toEqual('foo');
      done();
    });

    it('does not append trailing separator when directory & symlink', function (done: MochaDone) {
      const file = new Vinyl({
        path: '/test/foo',
        stat: Object.assign(
          new fs.Stats(),
          {
            isDirectory: (): boolean => true,
            isSymbolicLink: (): boolean => true
          }
        )
      });

      expect(file.basename).toEqual('foo');
      done();
    });

    it('removes trailing separator', function (done: MochaDone) {
      const file = new Vinyl({
        path: '/test/foo/',
      });

      expect(file.basename).toEqual('foo');
      done();
    });

    it('removes trailing separator when directory', function (done: MochaDone) {
      const file = new Vinyl({
        path: '/test/foo/',
        stat: Object.assign(
          new fs.Stats(),
          {
            isDirectory: (): boolean => true
          }
        )
      });

      expect(file.basename).toEqual('foo');
      done();
    });

    it('removes trailing separator when symlink', function (done: MochaDone) {
      const file = new Vinyl({
        path: '/test/foo/',
        stat: Object.assign(
          new fs.Stats(),
          {
            isSymbolicLink: (): boolean => true
          }
        )
      });

      expect(file.basename).toEqual('foo');
      done();
    });

    it('removes trailing separator when directory & symlink', function (done: MochaDone) {
      const file = new Vinyl({
        path: '/test/foo/',
        stat: Object.assign(
          new fs.Stats(),
          {
            isDirectory: (): boolean => true,
            isSymbolicLink: (): boolean => true
          }
        )
      });

      expect(file.basename).toEqual('foo');
      done();
    });

    it('throws on set with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.basename = 'test.coffee';
      }

      expect(invalid).toThrow('No path specified! Can not set basename.');
      done();
    });

    it('replaces the basename of the path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });

      file.basename = 'foo.png';
      expect(file.path).toEqual(path.normalize('/test/foo.png'));
      done();
    });
  });

  describe('stem get/set', function () {

    it('throws on get with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.stem;
      }

      expect(invalid).toThrow('No path specified! Can not get stem.');
      done();
    });

    it('returns the stem of the path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });

      expect(file.stem).toEqual('test');
      done();
    });

    it('throws on set with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.stem = 'test.coffee';
      }

      expect(invalid).toThrow('No path specified! Can not set stem.');
      done();
    });

    it('replaces the stem of the path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });

      file.stem = 'foo';
      expect(file.path).toEqual(path.normalize('/test/foo.coffee'));
      done();
    });
  });

  describe('extname get/set', function () {

    it('throws on get with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.extname;
      }

      expect(invalid).toThrow('No path specified! Can not get extname.');
      done();
    });

    it('returns the extname of the path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });

      expect(file.extname).toEqual('.coffee');
      done();
    });

    it('throws on set with no path', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.extname = '.coffee';
      }

      expect(invalid).toThrow('No path specified! Can not set extname.');
      done();
    });

    it('replaces the extname of the path', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
      });

      file.extname = '.png';
      expect(file.path).toEqual(path.normalize('/test/test.png'));
      done();
    });
  });

  describe('path get/set', function () {

    it('records path in history upon instantiation', function (done: MochaDone) {
      const file = new Vinyl({
        cwd: '/',
        path: '/test/test.coffee',
      });
      const history = [
        path.normalize('/test/test.coffee'),
      ];

      expect(file.path).toEqual(history[0]);
      expect(file.history).toEqual(history);
      done();
    });

    it('records path in history when set', function (done: MochaDone) {
      const val = path.normalize('/test/test.js');
      const file = new Vinyl({
        cwd: '/',
        path: '/test/test.coffee',
      });
      const history = [
        path.normalize('/test/test.coffee'),
        val,
      ];

      file.path = val;
      expect(file.path).toEqual(val);
      expect(file.history).toEqual(history);

      const val2 = path.normalize('/test/test.es6');
      history.push(val2);

      file.path = val2;
      expect(file.path).toEqual(val2);
      expect(file.history).toEqual(history);
      done();
    });

    it('does not record path in history when set to the current path', function (done: MochaDone) {
      const val = path.normalize('/test/test.coffee');
      const file = new Vinyl({
        cwd: '/',
        path: val,
      });
      const history = [
        val,
      ];

      file.path = val;
      file.path = val;
      expect(file.path).toEqual(val);
      expect(file.history).toEqual(history);
      done();
    });

    it('does not record path in history when set to empty string', function (done: MochaDone) {
      const val = path.normalize('/test/test.coffee');
      const file = new Vinyl({
        cwd: '/',
        path: val,
      });
      const history = [
        val,
      ];

      file.path = '';
      expect(file.path).toEqual(val);
      expect(file.history).toEqual(history);
      done();
    });

    it('throws on set with null path', function (done: MochaDone) {
      const file = new Vinyl();

      expect(file.path).toNotExist();
      expect(file.history).toEqual([]);

      function invalid() {
        file.path = null;
      }

      expect(invalid).toThrow('path should be a string.');
      done();
    });

    it('normalizes the path upon set', function (done: MochaDone) {
      const val = '/test/foo/../test.coffee';
      const expected = path.normalize(val);
      const file = new Vinyl();

      file.path = val;

      expect(file.path).toEqual(expected);
      expect(file.history).toEqual([expected]);
      done();
    });

    it('removes the trailing separator upon set', function (done: MochaDone) {
      const file = new Vinyl();
      file.path = '/test/';

      expect(file.path).toEqual(path.normalize('/test'));
      expect(file.history).toEqual([path.normalize('/test')]);
      done();
    });

    it('removes the trailing separator upon set when directory', function (done: MochaDone) {
      const file = new Vinyl({
        stat: Object.assign(
          new fs.Stats(),
          {
            isDirectory: (): boolean => true
          }
        )
      });
      file.path = '/test/';

      expect(file.path).toEqual(path.normalize('/test'));
      expect(file.history).toEqual([path.normalize('/test')]);
      done();
    });

    it('removes the trailing separator upon set when symlink', function (done: MochaDone) {
      const file = new Vinyl({
        stat: Object.assign(
          new fs.Stats(),
          {
            isSymbolicLink: (): boolean => true
          }
        )
      });
      file.path = '/test/';

      expect(file.path).toEqual(path.normalize('/test'));
      expect(file.history).toEqual([path.normalize('/test')]);
      done();
    });

    it('removes the trailing separator upon set when directory & symlink', function (done: MochaDone) {
      const file = new Vinyl({
        stat: Object.assign(
          new fs.Stats(),
          {
            isDirectory: (): boolean => true,
            isSymbolicLink: (): boolean => true
          }
        )
      });
      file.path = '/test/';

      expect(file.path).toEqual(path.normalize('/test'));
      expect(file.history).toEqual([path.normalize('/test')]);
      done();
    });
  });

  describe('symlink get/set', function () {

    it('return null on get with no symlink', function (done: MochaDone) {
      const file = new Vinyl();

      expect<string | null>(file.symlink).toEqual(null);
      done();
    });

    it('returns _symlink', function (done: MochaDone) {
      const val = '/test/test.coffee';
      const file: Vinyl & {_symlink: string} = <any> new Vinyl();
      file._symlink = val;

      expect(file.symlink).toEqual(val);
      done();
    });

    it('throws on set with non-string', function (done: MochaDone) {
      const file = new Vinyl();

      function invalid() {
        file.symlink = <any> null;
      }

      expect(invalid).toThrow('symlink should be a string');
      done();
    });

    it('sets _symlink', function (done: MochaDone) {
      const val = '/test/test.coffee';
      const expected = path.normalize(val);
      const file: Vinyl & {_symlink: string} = <any> new Vinyl();
      file.symlink = val;

      expect(file._symlink).toEqual(expected);
      done();
    });

    it('allows relative symlink', function (done: MochaDone) {
      const val = 'test.coffee';
      const file = new Vinyl();
      file.symlink = val;

      expect(file.symlink).toEqual(val);
      done();
    });

    it('normalizes and removes trailing separator upon set', function (done: MochaDone) {
      const val = '/test/foo/../bar/';
      const expected = path.normalize(val.slice(0, -1));
      const file = new Vinyl();
      file.symlink = val;

      expect(file.symlink).toEqual(expected);
      done();
    });
  });
});
