
import amdLoader from "./amd-loader";

/**
 *
 * @param loaderFunction
 * @return {LoaderDef}
 */
export default  (loaderFunction = amdLoader) => {
    // noinspection Annotator
    return Object.freeze({
        load: id => new Promise((resolve, reject) => loaderFunction(id, resolve, reject))
    });
};

