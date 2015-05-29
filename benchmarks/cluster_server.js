var cluster = require('cluster');
var net = require('net');

if (cluster.isMaster) {
  // The constraint of 4 processes allows a better comparison to the Hive
  // threading model, wherein the default libuv thread pool size is 4.
  for (var i = 0; i < 4; i++) {
    cluster.fork();
  }
} else {
  net.createServer(function(conn) {
    conn.on('data', function(data) {
      conn.end('' + eval(data.toString()));
    });
  }).listen('/tmp/hive.sock');
}
