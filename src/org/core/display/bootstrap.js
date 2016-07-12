/**
 * Created by marco.gobbi on 21/01/2015.
 */
import MediatorsBuilder from "./MediatorsBuilder";
import DomWatcher from "./DomWatcher";
import ScriptLoader from "../net/ScriptLoader";
import MediatorHandler from "./MediatorHandler";

export default ({definitions,domWatcher=DomWatcher,loader=ScriptLoader,mediatorHandler=MediatorHandler(),root=document.body})=> {
    var domWatcher = DomWatcher(mediatorHandler.getAllElements);
    var builder = MediatorsBuilder(domWatcher, loader, mediatorHandler, definitions);
    return builder.bootstrap(root);

}


