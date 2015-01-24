define(['underscore'], function( _ ) {
  return function( config ) {
    // Set some defaults
    if (!config) {
      config = {};
    }

    config['modules'] = config['modules'] || [];



    var output = 'require([';



    output += config['modules'].map(function (detect) {
      return '"' + detect + '"';
    }).toString();

    output += '], function( '+config.corename;
    output += ') {\n'  ;
    output +=  '});';
    return output;
  };
});
