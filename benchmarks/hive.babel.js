var Hive = require('..');

var assert = require('assert');
var async = require('async');
var util = require('util');
var utils = require('./utils');

Hive.init();

function measureHive(samples, callback) {
  var start = process.hrtime();
  var latencies = [];

  async.times(samples, function(n, next) {
    Hive.eval('1 + 1;', function(err, res, latency) {
      latencies.push(latency);
      assert.equal(2, res);
      next();
    });
  }, function(err) {
    var diff = process.hrtime(start);
    var elapsed = (diff[0] * 1e9 + diff[1]) / 1000000;
    var avgLatency = utils.avg(latencies);
    callback(null, elapsed, avgLatency);
  });
}

// First, run 100 samples to ensure the thread local context variables set,
// so that we don't measure threads contending for the mutex.
measureHive(100, function(err, elapsed, latency) {
  async.series([
    measureHive.bind(null, 4),
    measureHive.bind(null, 20),
    measureHive.bind(null, 100),
    measureHive.bind(null, 1000)
  ], function(err, results) {
    var samples = [4, 20, 100, 1000];
    results.forEach(function(result, i) {
      var elapsed = result[0].toFixed(3);
      var latency = result[1].toFixed(3);
      console.log(util.format('Hive, requesting %s tasks:', samples[i]));
      console.log(
        util.format('  %sms elapsed, %sms average latency', elapsed, latency)
      );
    });
  });
});
