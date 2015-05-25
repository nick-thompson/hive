var path = require('path');
var exec = require('child_process').exec;

var Hive = require('../lib/Hive');

var expr = path.resolve('./test/fixtures/expr.js');
var logExpr = path.resolve('./test/fixtures/log-expr.js');
var n = +process.argv[2];

function log(name, samples, time) {
  console.log(
    '%s benchmark for %d samples: %sms',
    name,
    samples,
    time.toFixed(3)
  );
}

function measureHive(samples, callback) {
  var left = samples;
  var start = process.hrtime();

  for (var i = 0; i < samples; i++) {
    Hive.evalFile(expr, function(err, res) {
      if (--left === 0) {
        var diff = process.hrtime(start);
        var elapsed = (diff[0] * 1e9 + diff[1]) / 1000000;
        return callback(null, elapsed);
      }
    });
  }
}

function measureExec(samples, callback) {
  var left = samples;
  var start = process.hrtime();

  for (var i = 0; i < samples; i++) {
    exec('node ' + logExpr, function(err, stdout, stderr) {
      if (--left === 0) {
        var diff = process.hrtime(start);
        var elapsed = (diff[0] * 1e9 + diff[1]) / 1000000;
        return callback(null, elapsed);
      }
    });
  }
}

// Run measurements in serial to ensure thread-pool contention is not a factor
// in the results.
measureHive(n, function(err, time) {
  log('Hive', n, time);
  measureExec(n, function(err, time) {
    log('Exec', n, time);
  });
});
