var addon = require('bindings')('addon.node');

function init(script) {
  script = script || "";
  return addon.init(script);
}

function eval(expr, callback) {
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
