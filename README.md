#### 2017-04-01 ... v5.0.0 doesn't support custom element, because of big refactor.
RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
Add a node to the DOM and a JS will be loaded!
Remove a node and the JS will be disposed!!
Not further framework frontend , but a tool that lets you manage the association DOM and JS. (less than 6kb gzipped);

# The idea behind the code
To understand how and why I decided to write this tool, please read this [post](https://github.com/marcog83/RoboJS/wiki/RoboJS-::-the-idea-behind-the-code)

# Quick Demo
A quick demo can be found [HERE](http://marcog83.github.io/RoboJS/). It simulate a bunch of modules loaded from server and a page where to place them (on the right). 

# Installation
```javascript
bower install robojs
```


# How it works.
You set a `data-mediator` attribute with an ID (whatever you want)
```html
    <div data-mediator="my-custom-element">a-2</div>
    <div data-mediator="foo-element">b-1</div>
    <div data-mediator="bar-element">c-1</div>
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

# Usage

```javascript
import {bootstrap} from "robojs"
//basic usage
bootstrap({definitions: definitions}) // return {dispose,promise}

```
you can store, and use later, the returned Object from bootstrap function. 
```javascript
import {bootstrap} from "robojs"
var application=bootstrap({definitions: definitions}) // return {dispose,promise}

//you can handle when every Mediators in page are executed
application.promise.then(function(){
	console.log("all mediators loaded")
}).catch(function(e){
	console.log("something went wrong",e);
})

//later in your code you can dispose the RoboJS instance.
application.dispose();
```

# MediatorsBuilder
`MediatorsBuilder` will iterate the DOM trying to match definitions.js **keys** with `data-mediator` attributes.
Each time it finds a match, a request is send to load the right script.
The first time the script is loaded from network, while the next one is retrived from cache.
`MutationObserver` is used to handle DOM changes, and when it happens MediatorsBuilder iterates over the new added nodes.


# Mediator Object.
Mediator is the context where your logic runs for a specific Mediator.
When a `data-mediator` attribute matches an ID from MediatorsMap the `Mediator` constructor is called and a function returns. The returned function is called later when the module will be disposed.
`Mediator` constructor takes two parameters, `node` and `dispatcher`. `node` is a reference to DOM element, `dispatcher` is a reference to `EventDispatcher` Object

```javascript
    function MediatorA(node,dispacther) {
		return function(){
           // destroy everything, es. handlers
        }
   	}
```

# Custom Elements

RoboJS is a composable library that allow you to change the way you create modules and add logics to your application.
**data-mediator mechanism** is my first solution to the problem, but moving on, custom elements are an easy, native way to  deal with it.
This is why I decided to add `CustomElementHandler` Object
This function constructor allow you to register and create your `Custom Elements`.

By default your modules are handled by `data-mediator` mechanism, but you can set mediatorHandler in order to use custom elements.

``` javascript
import {bootstrap,CustomElementHandler} from "robojs"
 bootstrap({
            definitions: definitions,
            mediatorHandler:CustomElementHandler()
        })
```

HTML markup looks like the following

```html
    <my-custom-element>a-2</my-custom-element>
    <foo-element>b-1</foo-element>
    <bar-element>c-1</bar-element>
```


Your Custom Element should be defined in a function that returns an Object.

``` javascript
function FooElement() {
		return {
			createdCallback: function () {
				console.log("created foo element", this);
				this.addEventListener("click",function(e){
					e.currentTarget.parentElement.removeChild(e.currentTarget);
					e.stopPropagation();
				})
			},
			attachedCallback: function () {
				console.log("attached foo element", this)
			},
			detachedCallback: function () {
				console.log("deattached foo element", this)
			}
		}
	}
```

Behind the scene CustomElementHandler creates a new Object extending HTMLElement prototype. Then it assigns your implementation to it.
Finally RoboJS registers the new element with `document.registerElement` API

``` javascript
 var customProto = FooElement();// your function constructor
 var proto = Object.assign(Object.create(HTMLElement.prototype), customProto);
 document.registerElement(id, {prototype: proto});
```


RoboJS recognizes new element added to DOM, if the new node `tagname` matches any id in `definitions.js` map and the element is not registered yet, the right script will be requested and executed.
Sample folder contains a demo.

# Loader Object
Default loader is `SystemJS` based.

```html
<script src="system.js"></script>
<script>
	System.config({
		defaultJSExtensions: true,
		paths:{
			robojs:"../../dist/robojs.es6"
		}
	});

	System.import("./client/Application");
</script>
```
and inside `Application.js` you invoke `bootstrap` function

```javascript
import {bootstrap} from "robojs"
bootstrap({definitions: definitions})
```
An example can be found in sample/systemjs folder.




## AmdLoader Object

If your project is AMD-style you can pass `AmdLoader` to bootstrap spec Object. `AmdLoader` supposes that `require` function is in global space.


```javascript
import {bootstrap,AmdLoader} from "robojs"
bootstrap({definitions: definitions,loader:AmdLoader()})
```

You can customize script loading strategy passing a function to `AmdLoader`.

```javascript
import {bootstrap,AmdLoader} from "robojs"
function loadWithRequire(id,resolve,reject){
    require([id],resolve,reject);
}
bootstrap({definitions: definitions,loader:AmdLoader(loadWithRequire)})
```

### EventDispatcher Object.
The `EventDispatcher` can be your messaging System. It dispatches and listens to `Events` from your Application. 
It's meant to be a Singleton in your application.

You can get a new instance of EventDispatcher by calling `getEventDispatcher` function

```javascript
import {getEventDispatcher} from "robojs"
var myNewEventDispatcher=getEventDispatcher();
```
	




## RequireJS configuration

This is an example how you can set dependencies using `RequireJS`

```javascript

requirejs.config({
	paths: {		
        robojs: "../../dist/robojs.es6"
	}
});

```
## SystemJS configuration

This is an example how you can set dependencies using `SystemJS`

```javascript

System.config({
		defaultJSExtensions: true,
		paths:{
			robojs:"../../dist/robojs.es6"
		}
	});

```

or using **Globals**
 
> **NB**. If you use robojs as global, you need some kind of script loader. If your project has SystemJS or RequireJS, please don't use global.

```html
<script src="../../dist/robojs.es6.js"></script>
<script>
var definitions={
                    "my-custom-element": "client/my-custom-element",
                    "foo-element": "client/foo-element",
                    "bar-element": "client/bar-element"
                }
robojs.bootstrap({definitions:definitions})
</script>
```

# Dependencies


RoboJS depends on some **[RamdaJS](http://ramdajs.com/)** functions.

```javascript
	// DomWatcher.js
	//

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
>**NO** needs to import ramda library.

### Build project
transpiling es6 sources to es5 is handled by AWESOME project [jspm](http://jspm.io/), that is a package manager for the SystemJS universal module loader, built on top of the dynamic ES6 module loader. 
You can run npm script named `build` or you can run it from command line.

```
jspm bundle-sfx src/core/robojs dist/robojs.es6.js --format umd
```


### Polyfills  
1. A stand-alone working lightweight version of the W3C Custom Elements specification.[document-register-element](https://github.com/WebReflection/document-register-element)

**MutationObserver**: if you need a polyfill you can check
1. [Webcomponents](https://github.com/webcomponents) polyfill.
2. [MutationObserver](https://github.com/megawac/MutationObserver.js) by megawac.

## Articles about Custom Elements##
1. [HTML5 rocks](http://www.html5rocks.com/en/tutorials/webcomponents/customelements/): Excellent article about custom elements, and WebComponents in general.
2. [MDN Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements)
3. [MDN Document.registerElement()](https://developer.mozilla.org/en-US/docs/Web/API/Document/registerElement)

