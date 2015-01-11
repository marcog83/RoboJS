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
           this.view.onSearchDone.add(this._handleSearchDone, this);
           this.view.onSearchFailed.add(this._handleSearchFailed, this);
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

As far as *results-module* , it listens to *"search-done"* event and updates the `view`.
`view` is an instance of `ResultsPanel`.


Now if we have a look at `SearchPanel` and `ResultsPanel` we can see that they are implemented in 2 totally different way.

-   `SearchPanel` uses RxJS AWESOME Functional Reactive Library
-   `ResultsPanel` uses AngularJS OMG framework.

Actually I pushed a bit to show that RoboJS is not about modules implementation, but 
**WHEN A MODULE SHOULD BE BOOTSTRAPED**.
