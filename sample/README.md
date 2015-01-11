## AMD and GLOBAL

this is a basic example of how RoboJS works in an AMD or global enviroment.
You can notice that RoboJS fit well with AMD enviroment and RequireJS. Because I started developing with RequireJS in mind.

## NATIVE-PROMISE

This is a basic example of how to change Promise dependency. AMD sample uses bluebird, this sample uses native promise.

## REAL-WORLD-PROJECT

This sample shows how I use RoboJS in my projects.
Application.js drops down.

The main idea is:

-   create your modules as you desire.

-   create a mediator for each module and map them in MediatorsMap.

-   If a module should communicate with another, let mediator dispatches an Event and another listens to that event

### Example

Let's see *search-panel* module. The folder structure is

    |--> modules

    |-->search-panel

    |-->Mediator.js

    |-->SearchPanel.js


