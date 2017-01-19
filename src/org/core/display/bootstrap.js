/**
 * Created by marco.gobbi on 21/01/2015.
 */
import MediatorsBuilder from "./MediatorsBuilder";
import _DomWatcher from "./DomWatcher";
import ScriptLoader from "../net/ScriptLoader";
import MediatorHandler from "./MediatorHandler";

export default (options)=> {
    var {definitions, loader = ScriptLoader(), mediatorHandler = MediatorHandler(), root = document.body}=options;
    var DomWatcher = options.domWatcher || _DomWatcher;
    var domWatcher = DomWatcher(mediatorHandler.getAllElements,root);
    var builder = MediatorsBuilder(domWatcher, loader, mediatorHandler, definitions);

    return {
        promise: builder.bootstrap(root)
        , dispose: builder.dispose
    }

}


