var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var samples = +process.argv[2];
var runs = 10;

function runCluster(callback) {
  var server = spawn(
    'node',
    ['benchmarks/cluster_server.js'],
    {stdio: 'inherit'}
  );

  exec('rm /tmp/hive.sock', function(err, stdout, stderr) {
    setTimeout(function() {
      var left = runs;
      for (var i = 0; i < runs; i++) {
        exec(
          'node benchmarks/cluster.js ' + samples,
          function(err, stdout, stderr) {
            console.log(stdout.replace(/\n/g, ''));
            if (--left === 0) {
              server.kill();
              callback();
            }
          }
        );
      }
    }, 1000)
  });
}

function runHive(callback) {
  var left = runs;
  for (var i = 0; i < runs; i++) {
    exec(
      'node benchmarks/hive.js ' + samples,
      function(err, stdout, stderr) {
        console.log(stdout.replace(/\n/g, ''));
        if (--left === 0) {
          callback();
        }
      }
    );
  }
}

console.log('Cluster:');
runCluster(function() {
  console.log('Hive:');
  runHive(function() {
    console.log('Done.');
  });
});
