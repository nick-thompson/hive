var Hive = require('..');

var assert = require('assert');

function measureHive(samples, callback) {
  var left = samples;
  var start = process.hrtime();

  for (var i = 0; i < samples; i++) {
    Hive.eval('1 + 1;', function(err, res) {
      assert.equal('2', res);
      if (--left === 0) {
        var diff = process.hrtime(start);
        var elapsed = (diff[0] * 1e9 + diff[1]) / 1000000;
        return callback(null, elapsed);
      }
    });
  }
}

// First pass to warm the thread-local caches to ensure that our measurement
// concerns only the interactions we're interested in.
measureHive(100, function() {
  measureHive(+process.argv[2], function(err, time) {
    console.log(time.toFixed(6));
  });
});
