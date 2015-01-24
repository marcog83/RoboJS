RoboJS is basically designed to load specific JS , depending on how DOM is composed. That's fine.
It has an implementation of MutationObserver to watch the DOM and a RequireJS dependency to load external resources.
But what if you want use your own watcher or your own loader?

***Here is where dependency injection can help.*** MediatorsBuilder needs 4 constructor parameters to be instantiated, and you can inject your objects there.

An implementation could be something like

```javascript
var builder = new  RoboJS.display.MediatorsBuilder(new MyWatcher(), new MyLoader(), new MyMediatorHandler(), MediatorsMap);
builder.bootstrap();
```

There's nothing wrong with that, but it's too much code !!!

This is why I thought about an Injector.
js-suspenders is the DI library that I choose to use.
Last piece of the puzzle is a system that can Abstract which implementation to map in Injector.
This is why I ported the extension system implemented by Robotlegs 2.0. Actually is a lightweight porting, but it fit my needs.

First of all you need to import
*robojs core library
*js-suspenders library
*robojs.extensions library

then in your main application you initialize a Context, installing all the extensions you need and a Configuration. The Config function will be your app-specific configuration.

```javascript
    var context = new RoboJS.framework.Context();

	    context.install(RoboJS.extensions.MVCBundle)
		        .configure(["Injector",Config],"MyAppConfig")
		        .initialize();
```

A minimal Config should configure the MediatorsMap

```javascript
function Config(injector) {
		this.injector = injector;
	}

	Config.prototype = {
		configure: function () {
			// configure your app dependencies;
			// mediators list
			this.injector.map('MediatorsMap').toValue(MediatorsMap);
		},
		initialize: function () {
			//initialize all
		}
	};
```

Finally when you initialize the context all dependencies will be resolved and Config.prototype.initialize function executed.

###RoboJS.extensions.MVCBundle###

This is a set of built-in extensions that could be used by default.
It has
* ***DomWatcherExtension***: this extension maps RoboJS.display.DisplayList as DOM-watcher
* ***EventDispatcherExtension*** this extension maps RoboJS.events.EventDispatcher as EventDispatcher
* ***LoaderExtension*** this exension maps RoboJS.net.ScriptLoader as ScriptLoader
* ***MediatorMapExtension*** this extension maps RoboJS.display.MediatorsBuilder and its dependencies. Then when everything is ready an instance of MediatorsBuilder will be created and bootstraped
