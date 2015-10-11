/**
 * Created by marco.gobbi on 21/01/2015.
 */
import MediatorsBuilder from "./MediatorsBuilder"
import DomWatcher from "./DomWatcher"
import ScriptLoader from "../net/ScriptLoader"


export default function bootstrap(config) {

    var {definitions,autoplay=true,domWatcher=DomWatcher(),scriptLoader=ScriptLoader}=config;

    var builder = MediatorsBuilder(domWatcher, scriptLoader, definitions);
    return autoplay ? builder.bootstrap() : builder;
};
