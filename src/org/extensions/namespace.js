/**
 * Created by marco.gobbi on 21/01/2015.
 */
define(["RoboJS", "./mediatorMap/MediatorMapExtension", "../bundles/MVCBundle"], function (RoboJS, MediatorMapExtension, MVCBundle) {
    "use strict";
    RoboJS.extensions = {
        MVCBundle: MVCBundle,
        MediatorMapExtension: MediatorMapExtension
    }
});