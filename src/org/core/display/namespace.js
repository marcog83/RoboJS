define(["../core", "./DisplayList", "./Mediator",  "./MediatorsBuilder","./bootstrap","./MediatorHandler"], function (RoboJS, DisplayList, Mediator, MediatorsBuilder,bootstrap,MediatorHandler) {
/*

* <strong>RoboJS.display</strong> package contains
* <ul>
*     <li>DisplayList</li>
*     <li>Mediator</li>
*     <li>bootstrap</li>
*     <li>MediatorBuilder</li>
* </ul>
*
* */
    RoboJS.display = {
        DisplayList: DisplayList,
        Mediator: Mediator,
	    bootstrap: bootstrap,
        MediatorHandler: MediatorHandler,
        MediatorsBuilder: MediatorsBuilder
    };


});