export class Loader {


    load(id) {
        return new Promise((resolve, reject) => this.onComplete(id, resolve, reject));
    }

    onComplete() {
        //not implemented
    }
}

export class AMDLoader extends Loader {
    onComplete(id, resolve, reject) {
        window.require([id], resolve, reject);
    }
}

export class CustomLoader extends Loader {

    constructor(fn) {
        super();
        this.fn = fn;
    }

    onComplete(id, resolve, reject) {
        this.fn(id, resolve, reject);
    }
}
