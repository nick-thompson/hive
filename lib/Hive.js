var addon = require('bindings')('addon.node');
var fs = require('fs');

/**
 * Wraps the user-specified callback in a closure that takes care of
 * any buffer manipulation.
 *
 * @param {Function} callback (err, { path: String, body: String, deps: Array })
 * @returns Function
 */
function proxy(callback) {
  return function _proxy(err, res) {
    if (err) {
      return callback(err);
    }

    // var pathLength = res.readUInt32BE();
    return callback(null, res);
  }
}

/**
 * Read the specified file and appropriate a buffer for the addon.
 *
 * @param {String} path
 * @param {Function} callback (err, { path: String, body: String, deps: Array })
 */
function take(path, callback) {
  fs.readFile(path, function(err, body) {
    return addon.take(path, body, proxy(callback));
  });
}

module.exports = {
  take: take
};
