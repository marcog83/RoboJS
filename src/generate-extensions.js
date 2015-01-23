define(['underscore'], function (_) {
    return function (config) {
        // Set some defaults
        if (!config) {
            config = {};
        }

        config['modules'] = config['modules'] || [];


        var output = 'require([';


        // Load in all the detects
        /* _(config['modules']).forEach(function (detect) {
         output += ' "' + detect + '",';
         });*/
        output += config['modules'].map(function (detect) {
            return '"' + detect + '"';
        }).toString();
        output += '], function( ';
        output += ') {\n';
        output += '});';
        return output;
    };
});
