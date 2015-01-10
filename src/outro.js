if ( typeof define === "function" && define.amd ) {
    define( "RoboJS", [], function() {
        return RoboJS;
    });
}else {
    // Leak RoboJS namespace
    window.RoboJS = RoboJS;
};
}));
