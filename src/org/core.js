define([], function () {
    /**
     <h1>RoboJS</h1>
     <p>RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
     Add a node to the DOM and a JS will be loaded!
     Remove a node and the JS will be disposed!!</p>

     <h1>Installation</h1>
     <p><pre><code>bower install robojs</code></pre></p>
     <h1>Dependencies</h1>
     <p> </p>
     <h1>Usage</h1>
     <p>You set a <code>data-mediator</code> attribute with an ID (whatever you want)
     ```html
     <div data-mediator="mediator-a">a-2</div>
     <div data-mediator="mediator-b">b-1</div>
     <div data-mediator="mediator-c">c-1</div>
     ```
     in <code>MediatorsMap.js</code> you define an Array that maps an ID and a Mediator path

     ```javascript
     [
     {
         "id": "mediator-a",
         "mediator": "client/MediatorA"
     },
     {
         "id": "mediator-b",
         "mediator": "client/MediatorB"
     },
     {
         "id": "mediator-c",
         "mediator": "client/MediatorC"
     }
     ]
     ```

     For instance in this sample I mapped 3 different Mediators.

     When the builder finds a match between a <code>data-mediator</code> attribute and an ID from <code>MediatorsMap</code>,
     it will create a new instance of Mediator, storing the DOM Node into a property named <code>element</code> and executes <code>initialize</code> method
     </p>
     <p>
     In this example we create an instance of <code>MediatorsBuilder</code> passing the map of Mediators.
     ```javascript
     var RoboJS=require("RoboJS");
     var MediatorsMap = require("./MediatorsMap");

     var builder = new RoboJS.display.MediatorsBuilder(MediatorsMap);
     builder.bootstrap().then(function (mediators) {
        // Mediators loaded --> mediators
    }).catch(function (e) { //catch an error});
     ```

     <p>
      When new DOM nodes are added to the document MutationObserver notify it, and a onAdded Signal is dispatched.
      The Signal argument is an Array of Mediator instances
     </p>
     ```javascript
     builder.onAdded.add(function (mediators) {
        // Mediators added async --> mediators
    });
     ```
     <p>
       when new DOM nodes are removed from the document MutationObserver notify it, and a onRemoved Signal is dispatched.
       The Signal argument is an instances of Mediator.
     </p>
     ```javascript
     builder.onRemoved.add(function (mediator) {
        // Mediator onRemoved async --> mediator
    });
     ```
     <p>
     In this example <code>bootstrap</code> method scans <code>document.body</code> looking for <code>data-mediator</code> attribute.<br/>
     But let's say... you dynamically attached some elements to the DOM.
     Well MutationObserver notify it and the <code>MediatorsBuilder</code> takes care to create the right Mediators.</p>

     ```javascript
     $(".add-button").on("click", function () {
        var element = $('<div data-mediator="mediator-b"></div>');
        element.click(function (e) {
            element.remove();
        });
        $("body").append(element);
    });
     ```
     <p>On click a new random <code>element</code> is added to the DOM tree, when an <code>element</code> is clicked, it will be removed.<br/>
     Every Mediators will be removed too.</p>

     </p>
     <h1>Api Reference</h1>
     */
    var RoboJS = {
        MEDIATORS_CACHE: {},
        utils: {
            uid: [
                '0',
                '0',
                '0'
            ],
            nextUid: function () {
                var index = this.uid.length;
                var digit;
                while (index) {
                    index--;
                    digit = this.uid[index].charCodeAt(0);
                    if (digit == 57 /*'9'*/) {
                        this.uid[index] = 'A';
                        return this.uid.join('');
                    }
                    if (digit == 90  /*'Z'*/) {
                        this.uid[index] = '0';
                    } else {
                        this.uid[index] = String.fromCharCode(digit + 1);
                        return this.uid.join('');
                    }
                }
                this.uid.unshift('0');
                return this.uid.join('');
            }
        }
    };
    return RoboJS;
});