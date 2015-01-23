define(["../extensions/mediatorMap/MediatorMapExtension","../extensions/domWatcher/DomWatcherExtension","../extensions/eventMap/EventDispatcherExtension","../extensions/net/LoaderExtension"],function (MediatorMapExtension, DomWatcherExtension, EventDispatcherExtension,LoaderExtension) {

    var MVCBundle = {
        extend: function (context) {
            context.install(
                DomWatcherExtension,
                EventDispatcherExtension,
                LoaderExtension,
                MediatorMapExtension
            );
        }
    };
    return MVCBundle;
});