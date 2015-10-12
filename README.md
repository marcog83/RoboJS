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

V2 is built on top of Custom Elements, so v1 `Mediators` now are real `Custom Elements`, with their lifecycle and logics.
RoboJS now focuses on loading JS to register elements when they  appear for the first time in the project.

You set a custom tag in your markup
```html
    <foo-element>a-2</foo-element>
    <bar-element>b-1</bar-element>

```
in `MediatorsMap.js` you define an Array that maps an ID and a Mediator path

```javascript
[
    {
        "id": "foo-element",
        "mediator": "client/foo-element"
    },
    {
        "id": "bar-element",
        "mediator": "client/bar-element"
    }
]
```

For instance in this sample I mapped 2 different Custom Elements.

When the builder finds a match between a `tagName`  and an ID from `MediatorsMap`, it will register the new found Element.
Then Custom Element takes care of instantiate the right code for each element.

#Mediator Object.
Mediator is the context where your logic runs for a specific bunch of DOM.
When a `tagName` matches an ID from MediatorsMap the `Mediator` constructor is called and the element is registered.


```javascript
   function MediatorBarElement() {
   		var proto = Object.create(HTMLElement.prototype);
   		proto.createdCallback = function () {
   			console.log("created", this)
   		};
   		proto.attachedCallback = function () {
   			console.log("attached", this)
   		};
   		proto.detachedCallback = function () {
   			console.log("deattached", this)
   		};
   		document.registerElement("bar-element", {prototype: proto})
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
jspm bundle-sfx src/org/core/robojs -o dist/robojs.es6.js --amd
```


###Polyfills###
A stand-alone working lightweight version of the W3C Custom Elements specification.
[document-register-element](https://github.com/WebReflection/document-register-element)

MutationObserver: if you need a polyfill you can check the [Webcomponents](https://github.com/webcomponents) polyfill.

##Articles about Custom Elements##
[HTML5 rocks](http://www.html5rocks.com/en/tutorials/webcomponents/customelements/): Excellent article about custom elements, and WebComponents in general.
[MDN Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements)
[MDN Document.registerElement()](https://developer.mozilla.org/en-US/docs/Web/API/Document/registerElement)