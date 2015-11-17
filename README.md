RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
Add a node to the DOM and a JS will be loaded!
Remove a node and the JS will be disposed!!
Not further framework frontend , but a tool that lets you manage the association DOM and JS. (less than 6kb gzipped);



#Installation
```javascript
bower install robojs
```


#How it works.
You set a `data-mediator` attribute with an ID (whatever you want)
```html
    <div data-mediator="mediator-a">a-2</div>
    <div data-mediator="mediator-b">b-1</div>
    <div data-mediator="mediator-c">c-1</div>
```
in `definitions.js` you define a Map where the key is an ID , and the value is the file to request in order to register the element.

```javascript
	{
        "my-custom-element": "client/my-custom-element",
        "foo-element": "client/foo-element",
        "bar-element": "client/bar-element"
    }
```

For instance in this sample I mapped 3 different Mediators.

When the builder finds a match between a `data-mediator` attribute and an ID from `MediatorsMap`,
it will create a new instance of Mediator, storing the DOM Node into a property named `element` and executes `initialize` method

#Usage

```javascript
rjs.bootstrap({definitions: definitions}) // [Object Promise]
```

#MediatorsBuilder
`MediatorsBuilder` will iterate the DOM trying to match definitions.js **keys** with `data-mediator` attributes.
Each time it finds a match, a request is send to load the right script.
The first time the script is loaded from network, while the next one is retrived from cache.
`MutationObserver` is used to handle DOM changes, and when it happens MediatorsBuilder iterates over the new added nodes.


#Mediator Object.
Mediator is the context where your logic runs for a specific Mediator.
When a `data-mediator` attribute matches an ID from MediatorsMap the `Mediator` constructor is called, an instance is created and the `initialize` function is called.


```javascript
    function MediatorA(dispacther) {
		return {
			initialize:function(node){

				// node is the DOM element
			},
			destroy:function(){
			   // destroy everything
			}
		}
   	}
```

###EventDispatcher Class.
The `EventDispatcher` is your messaging System. It dispatches and listens to `Events` from your Application. 
It's meant to be a Singleton in your application.

	
	
#Dependencies


RoboJS depends on some **[RamdaJS](http://ramdajs.com/)** functions.

```javascript
	// DomWatcher.js
	//
   import tap from "ramda/src/tap";
   import map from "ramda/src/map";
   import flatten from "ramda/src/flatten";
   import pluck from "ramda/src/pluck";
   import compose from "ramda/src/compose";
   //
   // MediatorsBuilder.js
   //
   import curryN from "ramda/src/curryN";
   import find from "ramda/src/find";
   import compose from "ramda/src/compose";
   import map from "ramda/src/map";
   import filter from "ramda/src/filter";
   import flatten from "ramda/src/flatten";
```
NO needs to import ramda library.


**`AMDScriptLoader` Object** supposes that `require` function is in global space, so if your project is AMD-style you can pass `AMDScriptLoader` to bootstrap spec Object

```javascript
rjs.bootstrap({definitions: definitions,loader:rjs.AMDScriptLoader})
```


This is an example how you can set dependencies in AMD with RequireJS

```javascript

requirejs.config({
	paths: {
		
        robojs: "../../dist/robojs.es6"
	}
});

```

or using Globals

```html
<script src="../../dist/robojs.es6.js"></script>
```

###Build project###
transpiling es6 sources to es5 is handled by AWESOME project [jspm](http://jspm.io/), that is a package manager for the SystemJS universal module loader, built on top of the dynamic ES6 module loader.

```
jspm bundle-sfx src/org/core/robojs dist/robojs.es6.js --format amd
```


###Polyfills###

MutationObserver: if you need a polyfill you can check the [Webcomponents](https://github.com/webcomponents) polyfill.

