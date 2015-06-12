var addon = require('bindings')('addon.node');

function init(script) {
  script = script || "";
  return addon.init(script);
}

function eval(expr, callback) {
  return addon.eval(expr, function(err, res) {
    if (err) return callback(err);
    if (typeof res === 'undefined') return callback(null);
    return callback(err, JSON.parse(res));
  });
}

module.exports = {
  eval: eval,
  init: init
};
