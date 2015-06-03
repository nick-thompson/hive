# hive

> Threaded script evaluation in Node.js.

Hive is largely an experiment in leveraging Node.js' default thread pool for improving the performance
of CPU-bound computations. Hive's main feature is an asynchronous variant of the builtin `eval` function, where
the expression passed will be executed in a separate context on one of the worker threads behind Node.js' event loop.

See the accompanying blog post [here]() for a more detailed introduction.

## Installation
```bash
$ npm install nick-thompson/hive
```

## Getting Started
Using Hive couldn't be easier. This module exports one function, `eval`, which takes

```js
Hive.eval('1 + 1;', function(err, res) {
  console.log(typeof res); // "number"
  console.log(res); // 2
});
```

## Caveats

## Motivation

## License

Copyright (c) 2015 Nick Thompson

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
