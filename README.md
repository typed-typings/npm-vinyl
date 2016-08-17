# Typed vinyl
[![Build Status](https://travis-ci.org/types/npm-vinyl.svg?branch=master)](https://travis-ci.org/types/npm-vinyl)

Typescript Typings for [vinyl](https://www.npmjs.com/package/vinyl).

## Installation
```sh
typings install --save vinyl
```

## Usage

```ts
import File from 'vinyl';

const tsFile = new File({
  cwd: '/',
  base: '/test/',
  path: '/test/file.ts',
  contents: new Buffer('test = 123')
});

```


## Contributing
You can run them the tests with `npm run build` and `npm run test`.

--------------------------------

_Based on typings by [vvakame](https://github.com/vvakame/) and [jedmao](https://github.com/jedmao)_
