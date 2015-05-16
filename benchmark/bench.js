var path = require('path');

var Hive = require('../lib/Hive');

var expr = path.resolve('./test/fixtures/expr.js');

function add(a, b) {
  return a + b;
}

function log(name, samples, mean) {
  console.log(
    '%s benchmark for %d samples: %sms',
    name,
    samples,
    mean.toFixed(3)
  );
}

function measureHive(samples, callback) {
  var left = samples;
  var results = [];

  for (var i = 0; i < samples; i++) {
    (function(i) {
      var start = process.hrtime();
      Hive.evalFile(expr, function(err, res) {
        var diff = process.hrtime(start);
        var elapsed = (diff[0] * 1e9 + diff[1]) / 1000000;
        results.push(elapsed);
        if (--left === 0) {
          var sum = results.reduce(add, 0);
          var mean = sum / samples;
          return callback(null, mean);
        }
      })
    })(i);
  }
}

// Must be run serially, otherwise the large-sample runs start counting time
// spent in the queue while runs from previous benchmarks are finishing.
measureHive(1, function(err, mean) {
  log('Hive', 1, mean);
  measureHive(10, function(err, mean) {
    log('Hive', 10, mean);
    measureHive(100, function(err, mean) {
      log('Hive', 100, mean);
    });
  });
});
