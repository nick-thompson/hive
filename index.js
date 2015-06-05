var addon = require('bindings')('addon.node');

addon.init();

function eval(expr, callback) {
  return addon.eval(expr, function(err, res) {
    if (err) return callback(err);
    return callback(err, JSON.parse(res));
  });
}

module.exports = {
  eval: eval
};
