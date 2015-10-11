RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
Add a node to the DOM and a JS will be loaded!
Remove a node and the JS will be disposed!!
Not further framework frontend , but a tool that lets you manage the association DOM and JS.



#Installation
```javascript
bower install robojs
```


#How it works.
robojs 2.0.0 changes a lot from 1.x.x. 2.0.0 is built on top of Custom Elements.
New documentation will be updated soon.

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
jspm bundle-sfx src/org/core/robojs -o dist/robojs.es6.js --amd
```


###MutationObserver polyfill###
if you need a polyfill you can check the [Webcomponents](https://github.com/webcomponents) polyfill.
