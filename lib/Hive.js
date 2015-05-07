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
    // Do I even need to do this??? Now that we're in thread-land, can just use
    // normal strings and the raw file buffer...
    var buf = new Buffer(body.length + 4);
    body.copy(buf, 4);
    buf.writeUInt32BE(body.length, 0);
    addon.take(buf, proxy(callback));
  })
}

module.exports = {
  take: take
};
