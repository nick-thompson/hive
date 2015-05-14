var addon = require('bindings')('addon.node');
var util = require('util');
var fs = require('fs');

var Packfile = fs.readFileSync('Packfile.js', {encoding: 'utf-8'});

/**
 * Read the specified file and appropriate a qualified script for evaluation
 * in a separate v8 isolate.
 *
 * @param {String} path
 * @param {Function} callback (err, { path: String, body: String, deps: Array })
 */
function take(path, callback) {
  fs.readFile(path, {encoding: 'utf-8'}, function(err, body) {
    var script = util.format('var $script = %s; %s', JSON.stringify(body), Packfile);
    return addon.take(path, script, callback);
  });
}

module.exports = {
  take: take
};
