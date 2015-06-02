var assert = require('assert');

var Hive = require('..');

describe('Hive', function() {

  describe('v8 Exceptions propagate as JS errors.', function() {

    it('should throw a reference error', function(done) {
      Hive.eval('x', function(err, res) {
        assert(err instanceof Error);
        assert(/ReferenceError/.test(err.message));
        done();
      });
    });

    it('should throw a type error', function(done) {
      Hive.eval('var x = 1; x();', function(err, res) {
        assert(err instanceof Error);
        assert(/TypeError/.test(err.message));
        done();
      });
    });

  });

});
