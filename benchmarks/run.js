var async = require('async');
var assert = require('assert');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var samples = +process.argv[2];
var runs = 10;

function add(a, b) {
  return a + b;
}

function sum(arr) {
  return arr.reduce(add, 0);
}

function runCluster(callback) {
  var results = [];
  exec('rm /tmp/hive.sock', function(err, stdout, stderr) {
    var server = spawn(
      'node',
      ['benchmarks/cluster_server.js'],
      {stdio: 'inherit'}
    );

    setTimeout(function() {
      async.timesSeries(runs, function(n, next) {
        exec(
          'node benchmarks/cluster.js ' + samples,
          function(err, stdout, stderr) {
            var res = +stdout.replace(/\n/g, '');
            results.push(res);
            console.log(res + 'ms');
            next();
          }
        );
      }, function(err) {
        server.kill();
        callback(results);
      });
    }, 1000);
  });
}

function runHive(callback) {
  var results = [];
  async.timesSeries(runs, function(n, next) {
    exec(
      'node benchmarks/hive.js ' + samples,
      function(err, stdout, stderr) {
        var res = +stdout.replace(/\n/g, '');
        results.push(res);
        console.log(res + 'ms');
        next();
      }
    );
  }, function(err) {
    callback(results);
  });
}

assert(
  typeof samples === 'number' && samples > 0,
  'Missing or incorrect argument supplied.'
);

console.log('Cluster:');
runCluster(function(clusterResults) {
  console.log('Hive:');
  runHive(function(hiveResults) {
    console.log('Done:');
    var clusterAverage = sum(clusterResults) / clusterResults.length;
    var hiveAverage = sum(hiveResults) / hiveResults.length;
    var pcnt = (clusterAverage - hiveAverage) / clusterAverage * 100;
    console.log('Hive ran ' + pcnt.toFixed(2) + '% faster than the cluster.');
  });
});
