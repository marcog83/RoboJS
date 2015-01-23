define(["../core", "./DisplayList", "./Mediator",  "./MediatorsBuilder","./bootstrap"], function (RoboJS, DisplayList, Mediator, MediatorsBuilder,bootstrap) {
/*

* <strong>RoboJS.display</strong> package contains
* <ul>
*     <li>DisplayList</li>
*     <li>Mediator</li>
*     <li>MediatorsFacade</li>
*     <li>MediatorBuilder</li>
* </ul>
*
* */
    RoboJS.display = {
        DisplayList: DisplayList,
        Mediator: Mediator,
	    bootstrap: bootstrap,
        MediatorsBuilder: MediatorsBuilder
    };


});