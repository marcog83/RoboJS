/**
 * Created by marco.gobbi on 21/01/2015.
 */
import MediatorsBuilder from "./MediatorsBuilder";
import DomWatcher from "./DomWatcher";
import ScriptLoader from "../net/ScriptLoader";


export default function bootstrap(config) {

    var {definitions,domWatcher=DomWatcher(),loader=ScriptLoader}=config;

    return MediatorsBuilder(domWatcher, loader, definitions).bootstrap();
}
