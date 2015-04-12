/**
 * Created by marco.gobbi on 21/01/2015.
 */
import MediatorsBuilder from "./MediatorsBuilder"
import DisplayList from "./DisplayList"
import ScriptLoader from "../net/ScriptLoader"
import MediatorHandler from "./MediatorHandler"

export default function bootstrap(config) {

    let {definitions,autoplay=true,domWatcher=DisplayList(),scriptLoader=ScriptLoader,mediatorHandler=MediatorHandler}=config;

    /*var displayList =config.domWatcher || DisplayList(),
     scriptLoader =config.scriptLoader || ScriptLoader,
     mediatorHandler =config.mediatorHandler || MediatorHandler;*/
    /**
     * get the mediators and return a promise.
     * The promise argument is an Array of Mediator instances
     */
    var builder = MediatorsBuilder(domWatcher, scriptLoader, mediatorHandler, definitions);
    return autoplay ? builder.bootstrap() : builder;
};
