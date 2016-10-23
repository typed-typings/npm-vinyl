import * as fs from 'fs';

declare namespace File {
  export interface FileOptions {

    /**
     * The current working directory of the file.
     *
     * Default: `process.cwd()`
     */
    cwd?: string;

    /**
     * Used for calculating the `relative` property. This is typically
     * where a glob starts.
     *
     * Default: `options.cwd`
     */
    base?: string;

    /**
     * The full path to the file.
     *
     * Default: `undefined`
     */
    path?: string | null;

    /**
     * Stores the path history. If `options.path` and `options.history`
     * are both passed, `options.path` is appended to `options.history`.
     * All `options.history` paths are normalized by the `file.path`
     * setter.
     *
     * Default: `[]` (or `[options.path]` if `options.path` is passed)
     */
    history?: string[];

    /**
     * The result of an fs.stat call. See fs.Stats for more information.
     * The result of an `fs.stat` call. This is how you mark the file as a
     * directory or symbolic link. See [isDirectory()](#),
     * [isSymbolic()](#) and [fs.Stats](#) for more information.
     *
     * Default: `undefined`
     */
    stat?: fs.Stats | null;

    /**
     * The contents of the file. If `options.contents` is a [`Stream`](#),
     * it is wrapped in a [`cloneable-readable`](#) stream.
     *
     * Default: `null`
     */
    contents?: Buffer | NodeJS.ReadWriteStream | null;

    /**
     *
     * Any other option properties will be directly assigned to the new Vinyl
     * object.
     *
     * ```js
     * var Vinyl = require('vinyl');
     *
     * var file = new Vinyl({ foo: 'bar' });
     * file.foo === 'bar'; // true
     * ```
     */
    [customProperty: string]: any;
  }
}

/**
 * A virtual file format.
 */
declare class File {
  /**
   * The constructor is used to create a new instance of `Vinyl`. Each
   * instance represents a separate file, directory or symlink.
   *
   * All internally managed paths (`cwd`, `base`, `path`, `history`) are
   * normalized and have trailing separators removed. See
   * [Normalization and concatenation](#) for more information.
   *
   * @param options Options may be passed upon instantiation to create a file
   *                with specific properties. Options are not mutated by the
   *                constructor.
   */
  constructor(options?: File.FileOptions);

  /**
   * Gets and sets the contents of the file. If set to a [`Stream`](#),
   * it is wrapped in a [`cloneable-readable`](#) stream.
   *
   * Throws when set to any value other than a [`Stream`](#), a
   * [`Buffer`](#) or `null`.
   *
   * Default: null
   */
  public contents: Buffer | NodeJS.ReadableStream | null;

  /**
   * Gets and sets current working directory. Will always be normalized and
   * have trailing separators removed.
   *
   * Throws when set to any value other than non-empty strings.
   */
  public cwd: string;

  /**
   * Gets and sets base directory. Used for relative pathing (typically where
   * a glob starts).
   * When `null` or `undefined`, it simply proxies the `file.cwd` property.
   * Will always be normalized and have trailing separators removed.
   *
   * Throws when set to any value other than non-empty strings or
   * `null`/`undefined`.
   */
  public base: string | null | undefined;

  /**
   * Gets and sets the absolute pathname string or `undefined`. Setting to a
   * different value appends the new path to `file.history`. If set to the
   * same value as the current path, it is ignored. All new values are
   * normalized and have trailing separators removed.
   *
   * Throws when set to any value other than a string.
   */
  public path: string | null | undefined;

  /**
   * Array of `file.path` values the Vinyl object has had, from
   * `file.history[0]` (original) through `file.history[file.history.length -
   * 1]` (current). `file.history` and its elements should normally be
   * treated as read-only and only altered indirectly by setting `file.path`.
   */
  public history: string[];

  /**
   * Gets the result of `path.relative(file.base, file.path)`.
   *
   * Throws when set or when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.relative); // file.js
   * ```
   */
  public relative: string;

  /**
   * Gets and sets the dirname of `file.path`. Will always be normalized and
   * have trailing separators removed.
   *
   * Throws when `file.path` is not set.
   *
   * Example:
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.dirname); // /test
   *
   * file.dirname = '/specs';
   *
   * console.log(file.dirname); // /specs
   * console.log(file.path); // /specs/file.js
   * ```
   */
  public dirname: string;

  /**
   * Gets and sets the basename of `file.path`.
   *
   * Throws when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   *   });
   *
   * console.log(file.basename); // file.js
   *
   * file.basename = 'file.txt';
   *
   * console.log(file.basename); // file.txt
   * console.log(file.path); // /test/file.txt
   * ```
   */
  public basename: string;

  /**
   * Gets and sets stem (filename without suffix) of `file.path`.
   *
   * Throws when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.stem); // file
   *
   * file.stem = 'foo';
   *
   * console.log(file.stem); // foo
   * console.log(file.path); // /test/foo.js
   * ```
   */
  public stem: string;

  /**
   * Gets and sets extname of `file.path`.
   *
   * Throws when `file.path` is not set.
   *
   * Example:
   *
   * ```js
   * var file = new File({
   *   cwd: '/',
   *   base: '/test/',
   *   path: '/test/file.js'
   * });
   *
   * console.log(file.extname); // .js
   *
   * file.extname = '.txt';
   *
   * console.log(file.extname); // .txt
   * console.log(file.path); // /test/file.txt
   * ```
   */
  public extname: string;


  /**
   * Gets and sets the path where the file points to if it's a symbolic link.
   * Will always be normalized and have trailing separators removed.
   *
   * Throws when set to any value other than a string.
   */
  public symlink: string;

  /**
   *
   * Any other option properties will be directly assigned to the new Vinyl
   * object.
   *
   * ```js
   * var Vinyl = require('vinyl');
   *
   * var file = new Vinyl({ foo: 'bar' });
   * file.foo === 'bar'; // true
   * ```
   */
  [customProperty: string]: any;

  // UNDOCUMENTED, see gulpjs/vinyl#119
  public stat: fs.Stats | null;

  /**
   * Returns `true` if the file contents are a [`Buffer`](#), otherwise
   * `false`.
   */
  public isBuffer(): boolean;

  /**
   * Returns `true` if the file contents are a [`Stream`](#), otherwise
   * `false`.
   */
  public isStream(): boolean;

  /**
   * Returns `true` if the file contents are `null`, otherwise `false`.
   */
  public isNull(): boolean;

  /**
   * Returns `true` if the file represents a directory, otherwise `false`.
   *
   * A file is considered a directory when:
   *
   * - `file.isNull()` is `true`
   * - `file.stat` is an object
   * - `file.stat.isDirectory()` returns `true`
   *
   * When constructing a Vinyl object, pass in a valid [`fs.Stats`](#) object
   * via `options.stat`. If you are mocking the [`fs.Stats`](#) object, you
   * may need to stub the `isDirectory()` method.
   */
  public isDirectory(): boolean;

  /**
   * Returns `true` if the file represents a symbolic link, otherwise
   * `false`.
   *
   * A file is considered symbolic when:
   *
   * - `file.isNull()` is `true`
   * - `file.stat` is an object
   * - `file.stat.isSymbolicLink()` returns `true`
   *
   * When constructing a Vinyl object, pass in a valid [`fs.Stats`](#) object
   * via `options.stat`. If you are mocking the [`fs.Stats`](#) object, you
   * may need to stub the `isSymbolicLink()` method.
   */
  public isSymbolic(): boolean;

  /**
   *
   * Returns a new Vinyl object with all attributes cloned.
   *
   * __By default custom attributes are cloned deeply.__
   *
   * If `options` or `options.deep` is `false`, custom attributes will not be
   * cloned deeply.
   *
   * If `file.contents` is a [`Buffer`](#) and `options.contents` is
   * `false`, the [`Buffer`](#) reference will be reused instead of
   * copied.
   */
  public clone(opts?: { contents?: boolean, deep?: boolean }): File;

  /**
   * Returns a formatted-string interpretation of the Vinyl object.
   * Automatically called by node's `console.log`.
   */
  public inspect(): string;

  /**
   * Static method used for checking if an object is a Vinyl file. Use this
   * method instead of `instanceof`.
   *
   * Takes an object and returns `true` if it is a Vinyl file, otherwise
   * returns `false`.
   *
   * __Note: This method uses an internal flag that some older versions of
   * Vinyl didn't expose.__
   *
   * Example:
   *
   * ```js
   * var Vinyl = require('vinyl');
   *
   * var file = new Vinyl();
   * var notAFile = {};
   *
   * Vinyl.isVinyl(file); // true
   * Vinyl.isVinyl(notAFile); // false
   * ```
   */
  public static isVinyl(obj: any): obj is File;

  /**
   * Static method used by Vinyl when setting values inside the constructor
   * or when copying properties in `file.clone()`.
   *
   * Takes a string `property` and returns `true` if the property is not used
   * internally, otherwise returns `false`.
   *
   * This method is usefuly for inheritting from the Vinyl constructor. Read
   * more in [Extending Vinyl](#).
   *
   * Example:
   *
   * ```js
   * var Vinyl = require('vinyl');
   *
   * Vinyl.isCustomProp('sourceMap'); // true
   * Vinyl.isCustomProp('path'); // false -> internal getter/setter
   * ```
   */
  public static isCustomProp(obj: any): boolean;
}

export = File;
