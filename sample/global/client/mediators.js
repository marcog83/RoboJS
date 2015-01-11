/**
 * Created by marco on 11/01/2015.
 */
!function (RoboJS) {
    // MediatorA
    function MediatorA() {
        RoboJS.display.Mediator.apply(this, arguments);
    }

    MediatorA.prototype = Object.create(RoboJS.display.Mediator.prototype, {

        initialize: {
            value: function () {
                console.log("MediatorA", this.element);
            }
        }
    });

// MediatorB
    function MediatorB() {
        RoboJS.display.Mediator.apply(this, arguments);
    }

    MediatorB.prototype = Object.create(RoboJS.display.Mediator.prototype, {
        constructor: {
            value: MediatorB
        },
        initialize: {
            value: function () {
                console.log("MediatorB", this.element);
                /**
                 * a new listener is added.
                 *
                 */
                this.addContextListener("evento", this._handleEvent, this);
            }
        },
        _handleEvent: {
            value: function (e) {
                console.log("_handleEvent", this);
                //this.removeContextListener("evento", this._handleEvento);
            }
        },
        destroy: {
            value: function () {
                console.log("destroy");
            }
        }
    });

//MediatorC
    function MediatorC() {
        RoboJS.display.Mediator.apply(this, arguments);
    }

    MediatorC.prototype = Object.create(RoboJS.display.Mediator.prototype, {
        initialize: {
            value: function () {
                console.log("ModuleC: " + this.element.innerHTML);
            }
        },
        destroy: {
            value: function () {
                console.log(this.element);
            }
        }
    });

    window.mediators = {
        MediatorA: MediatorA,
        MediatorB: MediatorB,
        MediatorC: MediatorC
    }
}(window.RoboJS);
