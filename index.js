var Hive = require('./lib/Hive');

var path = require('path');

var expr = path.resolve('./test/fixtures/expr.js');

for (var i = 0; i < 128; i++) {
  (function(j) {
    Hive.evalFile(expr, function(err, res) {
      console.log(j + ':', res);
    });
  })(i);
}
