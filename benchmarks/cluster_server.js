var cluster = require('cluster');
var net = require('net');

if (cluster.isMaster) {
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
