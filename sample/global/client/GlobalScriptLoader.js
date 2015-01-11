/**
 * Created by marco on 10/01/2015.
 */

// this is a naive GlobalScriptLoader just to show that is possible to get Mediators from global
//
function GlobalScriptLoader() {
}

GlobalScriptLoader.SCRIPTS_CACHE = {};
GlobalScriptLoader.prototype = {
    _getScript: function (url) {

        return new Promise(function (resolve, reject) {


            var script = document.createElement('script');
            script.src = url;
            var head = document.getElementsByTagName('head')[0], done = false;
            script.onload = script.onreadystatechange = function () {
                if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
                    done = true;
                    resolve(window.__async__);
                    script.onload = script.onreadystatechange = null;
                    head.removeChild(script);
                }
            };
            head.appendChild(script);
        });

    },
    /*
     it takes an array of paths, because could be more than 1 file to load before mediator.
     */
    get: function (path) {
        var mediator = _.chain(path.split("."))
            .reduce(function (result, key) {
                return result[key]
            }, window)
            .value();

        return Promise.resolve(mediator);
    }
};
