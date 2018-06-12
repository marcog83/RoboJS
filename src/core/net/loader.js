import amdLoader from "./amd-loader";

/**
 *
 * @param loaderFunction
 * @return {LoaderDef}
 */

export default class Loader {
    constructor() {
    }

    load(id) {
        return new Promise((resolve, reject) => this.onComplete(id, resolve, reject));
    }

    onComplete(id, resolve, reject) {
    }
}

export class AMDLoader extends Loader {
    onComplete(id, resolve, reject) {
        window.require([id], resolve, reject);
    }
}

