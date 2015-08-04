# hive

> Threaded script evaluation in Node.js.

Hive is an experiment in leveraging Node.js' default thread pool for improving the performance
of CPU-bound computations. Hive's main feature is an asynchronous variant of the builtin `eval` function, where
the expression passed will be executed in a separate context on one of the worker threads behind Node.js' event loop.

See the accompanying blog post [here](http://nickwritesablog.com/the-state-of-concurrent-javascript/) for a more detailed introduction.

**Note:** It turns out that this project is extremely similar to the more popular [Threads-A-Gogo](https://github.com/xk/node-threads-a-gogo). I haven't spent much time looking at this project,
but it seems that the primary difference is that **hive** does not expose an interface for you to create and manage
threads directly, whereas **TAGG** does. Rather, **hive** only allows evaluation on the existing threads in the 
default libuv thread pool.

## Installation

**Hive** is not available in the public npm registry as it is not intended for production use. Please either
install from source, or point npm to this repository.

```bash
$ npm install nick-thompson/hive
```

## Example Usage

```js
var Hive = require('hive');

function fib(n) {
  if (n < 2) {
    return 1;
  }
  return fib(n - 2) + fib(n - 1);
}

Hive.init(fib.toString());

Hive.eval('fib(35);', function(err, res) {
  console.log(res); // 14930352
});
```

## API

#### Hive.init(script: string) : undefined

Initialize Hive by creating N new v8 Isolates and v8 Contexts, where each Context will be prepared by evaluating
the given **script** argument. Exceptions raised by evaluating **script** will not be caught. **Hive.init** must
be called only once before calls to **Hive.eval**.

By default, Node.js' uses a libuv thread pool containing 4 threads, thus, upon initialization, Hive will create
4 new v8 Isolates and v8 Contexts. This number is configurable by setting the `UV_THREADPOOL_SIZE` environment
variable: `UV_THREADPOOL_SIZE=8 node myscript.js`.

#### Hive.eval(script: string, callback: function) : undefined

Queue the given **script** for evaluation on one of the worker threads in the pool. The result will be marshalled
via `JSON.stringify` for the safe exchange from the worker Isolate to the main thread Isolate, thus your result
must `stringify` successfully.

When the work is completed, **callback** will be called with three arguments: **(err, result, latency)**. The first
two are as you might expect, and **latency** will be the time, in milliseconds, that your request sat in the queue.

## Motivation

See the blog post linked in the introduction for a more thorough explanation of the motivation behind this
project.

JavaScript is an extremely popular language for implementing build tools for front end web projects. While this
certainly makes sense, it imposes an unfortunate limitation on the performance of the CPU-bound work required in
building such projects due to the single-threaded nature of JavaScript. Hive attempts to remedy this problem in
Node.js' by leveraging the existing libuv thread pool to enable concurrent JavaScript execution, while avoiding
the overhead of process-based parallelism common to Node.js developers via the builtin cluster module.

Hive is obviously not the first project to attempt to introduce the benefits of multi-threading to JavaScript.
In fact, a future version of Node.js will be expected to introduce Workers, similar to Web Workers, for concurrent
JavaScript execution, which would make Hive largely obsolete. Until then, this project only serves to help
demonstrate the value of such features in JavaScript.

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
