var net = require('net');
var async = require('async');
var assert = require('assert');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var util = require('util');
var utils = require('./utils');

function measureCluster(samples, callback) {
  var start = process.hrtime();
  var latencies = [];

  async.times(samples, function(n, next) {
    var socket = net.connect('/tmp/hive.sock');
    var buffer = '';
    socket.on('data', function(data) {
      buffer += data.toString();
    });
    socket.on('end', function() {
      var data = buffer.split('\0');
      assert.equal('2', data[0]);
      latencies.push(+data[1]);
      next();
    });
    socket.end('1 + 1;');
  }, function(err) {
    var diff = process.hrtime(start);
    var elapsed = (diff[0] * 1e9 + diff[1]) / 1000000;
    var avgLatency = utils.avg(latencies);
    callback(null, elapsed, avgLatency);
  });
}

exec('rm /tmp/hive.sock', function(err, stdout, stderr) {
  var server = spawn(
    'node',
    ['benchmarks/cluster_server.js'],
    {stdio: 'inherit'}
  );

  setTimeout(function() {
    async.series([
      measureCluster.bind(null, 4),
      measureCluster.bind(null, 20),
      measureCluster.bind(null, 100),
      measureCluster.bind(null, 1000)
    ], function(err, results) {
      server.kill();
      setTimeout(function() {
        var samples = [4, 20, 100, 1000];
        results.forEach(function(result, i) {
          var elapsed = result[0].toFixed(3);
          var latency = result[1].toFixed(3);
          console.log(util.format('Cluster, requesting %s tasks:', samples[i]));
          console.log(
            util.format('  %sms elapsed, %sms average latency', elapsed, latency)
          );
        });
      }, 1000);
    });
  }, 3000);
});
