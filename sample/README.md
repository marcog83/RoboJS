## AMD and GLOBAL

this is a basic example of how RoboJS works in an AMD or global enviroment.
You can notice that RoboJS fit well with AMD enviroment and RequireJS. Because I started developing with RequireJS in mind.

* * *

## NATIVE-PROMISE

This is a basic example of how to change Promise dependency. AMD sample uses bluebird, this sample uses native promise.

* * *

## REAL-WORLD-PROJECT

This sample shows how I use RoboJS in my projects.
Application.js doesn't exist!


The main idea is:

-   you create your modules as you desire.

-   you create a mediator for each module and map them in MediatorsMap.

-   If a module should communicate with another, let mediator dispatches an Event and another listens to that event

### Example

Let's see *search-panel* module. The folder structure is

    |--> modules
        |-->search-panel
            |-->Mediator.js
            |-->SearchPanel.js

in `Mediator` you instantiate a `SearchPanel` Object that is the concrete implementation.
`view` instance dispatches 2 events, when a search has been done and when the search failed.

```javascript

Mediator.prototype = Object.create(RoboJS.display.Mediator.prototype, {

   initialize: {
       value: function () {
           this.view = new SearchPanel(this.element);
           this.view.onSearchDone.connect(this._handleSearchDone, this);
           this.view.onSearchFailed.connect(this._handleSearchFailed, this);
           this.view.initialize();
       }
   },
   _handleSearchDone: {
       value: function (data) {
           this.dispatch("search-done", data);
       }
   },
   _handleSearchFailed: {
       value: function (e) {
           this.dispatch("search-failed", e);
       }
   }
});

```

As far as *results-module* , it listens to *"search-done"* event and updates the `view` that is an instance of `ResultsPanel`.

```javascript
Mediator.prototype = Object.create(RoboJS.display.Mediator.prototype, {

    initialize: {
        value: function () {
            this.view = new ResultsPanel(this.element);
            this.view.initialize();
            this.addContextListener("search-done",this._handleSearchDone,this)

        }
    },
    _handleSearchDone: {
        value: function (data) {
           this.view.update(data);
        }
    }
});
```


Now if we have a look at `SearchPanel` and `ResultsPanel` we can see that they are implemented in 2 totally different way.

-   `SearchPanel` uses RxJS AWESOME Functional Reactive Library
-   `ResultsPanel` uses AngularJS OMG framework.

`toggle` module doesn't need to communicate with other modules. For this reason we don't extend a `RoboJS.display.Mediator`. Instead we create a class `ToggleModule` that has `initialize` function.
By default `element` parameter is always passed into constructor by `MediatorsBuilder`

```javascript
function ToggleModule(element) {
    this.element = $(element);
}

ToggleModule.prototype = {
    initialize: function () {
        var JQUERY_MODULE = "<div class='results-panel' data-mediator='jquery-results-panel'></div>";
        var ANGULAR_MODULE = '<div class="results-panel" data-mediator="results-panel"><results-panel class="content"></results-panel></div>';
        this.element.on("click", function () {
            this.element.toggleClass("toggled");
            $(".results-panel").remove();
            var element, text;
            if (this.element.hasClass("toggled")) {
                element = JQUERY_MODULE;
                text = 'CHANGE TO ANGULAR MODULE';
            } else {
                element = ANGULAR_MODULE;
                text = 'CHANGE TO JQUERY MODULE';
            }
            this.element.html(text);
            $("body").append(element);
        }.bind(this))
    }
}
```

Actually I pushed a bit to show that RoboJS is not about modules implementation, but 
**WHEN A MODULE SHOULD BE BOOTSTRAPED**.
