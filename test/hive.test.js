var assert = require('assert');

var Hive = require('..');

describe('Hive', function() {

  describe('arbitrary evaluations execute as expected', function() {

    it('should be 2', function(done) {
      Hive.eval('1 + 1;', function(err, res) {
        assert.equal(typeof res, 'number');
        assert.equal(res, '2');
        done();
      });
    });

    it('should be "Hello World!"', function(done) {
      Hive.eval('"Hello " + "World!";', function(err, res) {
        assert.equal(typeof res, 'string');
        assert.equal(res, 'Hello World!');
        done();
      });
    });

    it('should marshal objects correctly', function(done) {
      Hive.eval('var r = {}; r.x = {y: "z"}; r;', function(err, res) {
        assert.equal(typeof res, 'object');
        assert.deepEqual(res, {
          x: {
            y: 'z'
          }
        });
        done();
      });
    });

    it('should marshal undefined correctly', function(done) {
      Hive.eval('', function(err, res) {
        assert.equal(null, err);
        assert.equal(typeof res, 'undefined');
        done();
      });
    });

  });

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
