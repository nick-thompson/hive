var Hive = require('./lib/Hive');

var path = require('path');

var expr = path.resolve('./test/fixtures/expr.js');
Hive.take(expr, function(err, res) {
  console.log(res);
});
