requirejs.config({
    waitSeconds:0,
    paths: {
        libraries: "./libs/libraries.min"
    }
});
require(["require", "libraries"], function (require) {

    require(["./Client"], function (Client) {
        Client();

    })
});