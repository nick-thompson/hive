var addon = require('bindings')('addon.node');
var assert = require('assert');

var initialized = false;

function init(script) {
  assert.equal(false, initialized, 'Hive.init must be called only once.');
  script = script || "";
  initialized = true;
  return addon.init(script);
}

function eval(expr, callback) {
  assert.equal(true, initialized, 'Hive.init must be called before Hive.eval.');
  return addon.eval(expr, function(err, res, latency) {
    if (err) return callback(err);
    if (typeof res === 'undefined') return callback(null, undefined, latency);
    return callback(err, JSON.parse(res), latency);
  });
}

module.exports = {
  eval: eval,
  init: init
};
