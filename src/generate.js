define(['underscore'], function( _ ) {
  return function( config ) {
    // Set some defaults
    if (!config) {
      config = {};
    }

    config['modules'] = config['modules'] || [];



    var output = 'require(["./org/core/core"';



    // Load in all the detects
    _(config['modules']).forEach(function (detect) {
      output += ', "' + detect + '"';
    });

    output += '], function( RoboJS';
    output += ') {\n'  ;
    output +=  '});';
    return output;
  };
});
