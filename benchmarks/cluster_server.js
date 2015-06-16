var cluster = require('cluster');
var net = require('net');

function fib(n) {
  if (n < 2) {
    return 1;
  }
  return fib(n - 2) + fib(n - 1);
}

if (cluster.isMaster) {
  // The constraint of 4 processes allows a better comparison to the Hive
  // threading model, wherein the default libuv thread pool size is 4.
  for (var i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  net.createServer(function(conn) {
    var start = process.hrtime();
    conn.on('data', function(data) {
      var diff = process.hrtime(start);
      var latency = (diff[0] * 1e9 + diff[1]) / 1000000;
      var result = JSON.stringify(eval(data.toString()));
      conn.end(result + '\0' + latency);
    });
  }).listen('/tmp/hive.sock');
}
