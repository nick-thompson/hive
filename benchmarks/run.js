var async = require('async');
var assert = require('assert');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var samples = +process.argv[2];
var runs = 10;

function runCluster(callback) {
  exec('rm /tmp/hive.sock', function(err, stdout, stderr) {
    var server = spawn(
      'node',
      ['benchmarks/cluster_server.js'],
      {stdio: 'inherit'}
    );

    setTimeout(function() {
      async.times(runs, function(n, next) {
        exec(
          'node benchmarks/cluster.js ' + samples,
          function(err, stdout, stderr) {
            console.log(stdout.replace(/\n/g, ''));
            next();
          }
        );
      }, function(err) {
        server.kill();
        callback();
      });
    }, 1000);
  });
}

function runHive(callback) {
  async.times(runs, function(n, next) {
    exec(
      'node benchmarks/hive.js ' + samples,
      function(err, stdout, stderr) {
        console.log(stdout.replace(/\n/g, ''));
        next();
      }
    );
  }, function(err) {
    callback();
  });
}

assert(
  typeof samples === 'number' && samples > 0,
  'Missing or incorrect argument supplied.'
);

console.log('Cluster:');
runCluster(function() {
  console.log('Hive:');
  runHive(function() {
    console.log('Done.');
  });
});
