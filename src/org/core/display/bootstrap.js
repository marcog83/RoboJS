/**
 * Created by marco.gobbi on 21/01/2015.
 */
import MediatorsBuilder from "./MediatorsBuilder"
import DomWatcher from "./DomWatcher"
import ScriptLoader from "../net/ScriptLoader"
import MediatorHandler from "./MediatorHandler"

export default function bootstrap(config) {

    let {definitions,autoplay=true,domWatcher=DomWatcher(),scriptLoader=ScriptLoader,mediatorHandler=MediatorHandler}=config;



    let builder = MediatorsBuilder(domWatcher, scriptLoader, mediatorHandler, definitions);
    return autoplay ? builder.bootstrap() : builder;
};
