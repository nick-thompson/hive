var net = require('net');
var assert = require('assert');

function measureCluster(samples, callback) {
  var left = samples;
  var start = process.hrtime();

  for (var i = 0; i < samples; i++) {
    var socket = net.connect('/tmp/hive.sock');
    socket.on('data', function(data) {
      assert.equal('2', data);
      if (--left === 0) {
        var diff = process.hrtime(start);
        var elapsed = (diff[0] * 1e9 + diff[1]) / 1000000;
        return callback(null, elapsed);
      }
    });
    socket.write('1 + 1;');
  }
}

measureCluster(+process.argv[2], function(err, time) {
  console.log(time.toFixed(3) + 'ms');
});
