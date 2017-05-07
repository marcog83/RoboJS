
import amdLoader from "./amd-loader";
export default  (loaderFunction = amdLoader) => {
    return Object.freeze({
        load: id => new Promise((resolve, reject) => loaderFunction(id, resolve, reject))
    });
}

