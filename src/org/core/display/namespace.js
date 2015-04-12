import RoboJS from "../core";
import DisplayList from "./DisplayList";
import Mediator from "./Mediator";
import MediatorsBuilder from "./MediatorsBuilder";
import bootstrap from "./bootstrap";
import MediatorHandler from "./MediatorHandler";
RoboJS.display = {
    DisplayList: DisplayList,
    Mediator: Mediator,
    bootstrap: bootstrap,
    MediatorHandler: MediatorHandler,
    MediatorsBuilder: MediatorsBuilder
};