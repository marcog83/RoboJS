RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
Add a node to the DOM and a JS will be loaded!
Remove a node and the JS will be disposed!!
Not further framework frontend , but a tool that lets you manage the association DOM and JS.



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
in `MediatorsMap.js` you define an Array that maps an ID and a Mediator path

```javascript
[
    {
        "id": "mediator-a",
        "mediator": "client/MediatorA"
    },
    {
        "id": "mediator-b",
        "mediator": "client/MediatorB"
    },
    {
        "id": "mediator-c",
        "mediator": "client/MediatorC"
    }
]
``` 
    	
For instance in this sample I mapped 3 different Mediators.

When the builder finds a match between a `data-mediator` attribute and an ID from `MediatorsMap`, 
it will create a new instance of Mediator, storing the DOM Node into a property named `element` and executes `initialize` method



###Example:

```javascript
// Application.js

var robojs=require("robojs");
var MediatorsMap = require("./MediatorsMap");
robojs.display.bootstrap({definitions:MediatorsMap});

```

This is the basic usage. ```bootstrap``` function creates a ```MediatorsBuilder``` instance and bootstraps it.

Most of the time you need invoking bootstrap in this way.

But if you need more control over ```MediatorsBuilder``` you can set ```autoplay``` to ```false```. This time bootstrap 
function just create ```MediatorsBuilder``` and  returns it. Then you can manually bootstrap it, attach handlers if needed. 


```javascript
// create an instance of MediatorsBuilder passing the map of Mediators.
// autoplay by default is true, but if you need more control, you can just pass true and manual bootstrap the builder
var builder = robojs.display.bootstrap({definitions:MediatorsMap,autoplay:false});

/*
 * get the mediators and return a promise.
 * The promise argument is an Array of Mediator instances
 *
 */
builder.bootstrap().then(function (mediators) {
    console.log("Mediators loaded", mediators);
}).catch(function (e) {
    console.log(e);
});

/*
 * when new DOM nodes are added to the document MutationObserver notify it, and a onAdded Signal is dispatched.
 * The Signal argument is an Array of Mediator instances
 *
 */
 
builder.onAdded.connect(function (mediators) {
    console.log("Mediators added async", mediators);
});

/*
 * when new DOM nodes are removed from the document MutationObserver notify it, and a onRemoved Signal is dispatched.
 * The Signal argument is an instances of Mediator.
 *
 */
 
builder.onRemoved.connect(function (mediator) {
    console.log("Mediators onRemoved async", mediator);
});
```

In this example `bootstrap` method scans `document.body` looking for `data-mediator` attribute

But let's say... you dynamically attached some elements to the DOM.
Well MutationObserver notify it and the `MediatorsBuilder` takes care to create the right Mediators.

```javascript
/**
 * on click a new random element is added to the DOM tree
 */
$(".add-button").on("click", function () {

    var element = $('<div data-mediator="mediator-b"></div>');
    /**
     * when an element is clicked, it will be removed.
     * Every Mediators will be removed too.
     */
    element.click(function (e) {
        element.remove();
    });

    $("body").append(element);
});
```

`sample folder` contains a working example with more use cases, nested and sibling nodes


#Mediator Object.
Mediator is the context where your logic runs for a specific bunch of DOM.
When a `data-mediator` matches an ID from MediatorsMap the `Mediator` constructor is called. 
An instance of `EventDispatcher` and `EventMap` are passed as parameters.

The `initialize` method is invoked and the DOM element is passed as parameter.

Mediators should observe the following forms:

* It  provide functions `initialize()` and, if needed, also `destroy()`.

`initialize()` function initializes the mediator. This is run automatically by the `MediatorBuilder` when a mediator is created. 
Normally the `initialize` function is where you would add handlers or dispatch events using the `eventMap`.

```javascript
    function MediatorA(dispacther,eventMap) {
		return {
			initialize:function(node){
				"use strict";
				// node is the DOM element
			},
			destroy:function(){
			   // destroy everything
			}
		}
	}
``` 
 
#EventDispatcher Class.
The `EventDispatcher` is your messaging System. It dispatches and listens to `Events` from your Application. 
It's meant to be a Singleton in your application.

	
	
###Dependencies


RoboJS depends on

**[RamdaJS](http://ramdajs.com/)** to deal with functional programming. Curry, reduce, map, filter etc... It is internally used. NO needs to import ramda library.

**`AMDScriptLoader` Object** supposes that `require` function is in global space, so if your project is AMD-style you can pass `AMDScriptLoader` to bootstrap spec Object

```javascript
robojs.display.bootstrap({definitions: definitions,scriptLoader:robojs.net.AMDScriptLoader})
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
jspm bundle-sfx src/org/core/robojs -o dist/robojs.es6.js
```


###MutationObserver polyfill###
if you need a polyfill you can check the [Webcomponents](https://github.com/webcomponents) polyfill.
