var addon = require('bindings')('addon.node');
var fs = require('fs');

function eval(script, callback) {
  return addon.eval(script, callback);
}

function evalFile(path, callback) {
  fs.readFile(path, {encoding: 'utf-8'}, function(err, body) {
    return eval(body, callback);
  });
}

module.exports = {
  eval: eval,
  evalFile: evalFile
};
