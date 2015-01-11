/**
 * Created by marco.gobbi on 18/12/2014.
 */
!function (RoboJS, $) {

    "use strict";
    // create the MediatorsMap.
    // mediator property is how Mediator is Registered in global scope.
    //
    var MediatorsMap = [
        {
            "id": "mediator-a",
            "mediator": "mediators.MediatorA"
        },
        {
            "id": "mediator-b",
            "mediator": "mediators.MediatorB"
        },
        {
            "id": "mediator-c",
            "mediator": "mediators.MediatorC"
        }
    ];


    // create an array of jQuery elements to append to the body on "click"

    var elements = [];
    elements.push($("<div data-mediator='mediator-c'><ul><li>lista a caso</li></ul></div>"));
    elements.push($('<div data-mediator="mediator-a">' +
    '<div data-mediator="mediator-a">' +
    ' <div data-mediator="mediator-b">aab' +
    '</div>' +
    ' </div>	' +
    '</div>'));
    elements.push($("" +
    "<div data-mediator='mediator-a'>primo nodo</div>" +
    "<div data-mediator='mediator-a'>secondo nodo</div>" +
    "<div data-mediator='mediator-c'>mediator c</div>" +
    "<span data-mediator='mediator-b'></span>"));
    /*
     helper function to get a random number from min to max
     */
    function getRandomArbitrary(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }

    function Application() {
        /**
         * EventDispatcher is the Singleton that is used to dispatch and listen to the events
         */
        this.eventDispatcher = RoboJS.events.EventDispatcher.getInstance();
    }

    Application.prototype = {
        main: function () {
            /**
             *
             * @type { RoboJS.display.MediatorsBuilder}
             * an instance of MediatorsBuilder to get mediators.
             * It looks for the entire DOM trying to match MediatorsMap ids with data-mediator attribute
             */
            var builder = new RoboJS.display.MediatorsBuilder(MediatorsMap);
            // override default ScriptLoader with one that load javascript without AMD style
            builder.loader = new GlobalScriptLoader();
            /**
             * get the mediators and return a promise.
             * The promise argument is an Array of Mediator instances
             */
            builder.bootstrap().then(function (mediators) {
                console.log("Mediators loaded", mediators);
            }).catch(function (e) {
                console.log(e);
            });
            /**
             * when new DOM nodes are added to the document MutationObserver notify it, and a onAdded Signal is dispatched.
             * The Signal argument is an Array of Mediator instances
             */
            builder.onAdded.add(function (mediators) {
                console.log("Mediators added async", mediators);
            });
            /**
             * when new DOM nodes are removed from the document MutationObserver notify it, and a onRemoved Signal is dispatched.
             * The Signal argument is an instances of Mediator.
             */
            builder.onRemoved.add(function (mediator) {
                console.log("Mediators onRemoved async", mediator);
            });
            /**
             * on click a new random element is added to the DOM tree
             */
            $(".add-button").on("click", function () {
                var index = getRandomArbitrary(0, 2);
                // NB if you don't clone the element, the same element will be
                // first removed from tree (and mediator is destroyed too)
                // then attached to body again (and a new mediator is created)
                var element = elements[index].clone();
                /**
                 * when an element is clicked, it will be removed.
                 * Every Mediators will be removed too.
                 */
                element.click(function (e) {
                    element.remove();
                });

                $("body").append(element);
            });
            /**
             * this is an example of Event dispatching.
             * MediatorB listens to it. When a new MediatorB instance is created, a new console.log is shown.
             */
            setInterval(function () {
                this.eventDispatcher.dispatchEvent("evento", {name: "evento"});
            }.bind(this), 4000);
        }
    };
    var app = new Application();
    app.main();
}(window.RoboJS, window.jQuery);