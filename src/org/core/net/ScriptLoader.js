define(["Promise"], function (Promise) {
    /*
     <h2>ScriptLoader</h2>
     */
    var ScriptLoader = {
        get: function (id) {
            return new Promise(function (resolve, reject) {
                require([id], resolve, reject);
            });
        }
    };

    return ScriptLoader;
});