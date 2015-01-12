define(["Promise"], function (Promise) {
   /*
   <h2>ScriptLoader</h2>
    */
    function ScriptLoader() {
    }

    ScriptLoader.prototype = {
        get: function (id) {
            return new Promise(function (resolve, reject) {
                require([id], function (Mediator) {
                    resolve(Mediator);
                });
            });
        }
    };
    return ScriptLoader;
});