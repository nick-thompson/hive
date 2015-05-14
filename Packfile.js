babel.transform($script, {
  resolveModuleSource: function(source, name) {
    return source;
  }
}).code;
