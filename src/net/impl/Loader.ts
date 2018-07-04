import {ILoader} from "../api/ILoader";

declare function require(path: Array<string>, resolve: Function, reject: Function): void;

export class Loader implements ILoader {
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
        require([id], resolve, reject);
    }
}

export class CustomLoader extends Loader {
    fn: Function;

    constructor(fn) {
        super();
        this.fn = fn;
    }

    onComplete(id, resolve, reject) {
        this.fn(id, resolve, reject);
    }
}
