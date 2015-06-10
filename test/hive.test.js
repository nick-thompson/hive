var assert = require('assert');

var Hive = require('..');

describe('Hive', function() {

  describe('evaluates arbitrary expressions as expected', function() {

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

  describe('has v8 Exceptions propagate as JS errors.', function() {

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

  describe('prepares each context with the Hivefile', function() {

    it('should have a global `babel` reference', function(done) {
      Hive.eval('typeof babel.transform', function(err, res) {
        assert.equal(null, err);
        assert.equal(typeof res, 'string');
        assert.equal(res, 'function');
        done();
      });
    });

    it('should transform valid JavaScript strings', function(done) {
      Hive.eval('babel.transform("function x() {}").code', function(err, res) {
        assert.equal(null, err);
        assert.equal(typeof res, 'string');
        assert.equal(res, '"use strict";\n\nfunction x() {}');
        done();
      });
    });

  });

});
