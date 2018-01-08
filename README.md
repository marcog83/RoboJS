
RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
Add a node to the DOM and a JS will be loaded!
Remove a node and the JS will be disposed!!
Not further framework frontend , but a tool that lets you manage the association DOM and JS in less than 4k gzipped;

[![Greenkeeper badge](https://badges.greenkeeper.io/marcog83/RoboJS.svg)](https://greenkeeper.io/)

# The idea behind the code


To understand how and why I decided to write this tool, please read this [post](https://github.com/marcog83/RoboJS/wiki/RoboJS-::-the-idea-behind-the-code)

# Quick Demo
A quick demo can be found [HERE](http://marcog83.github.io/RoboJS/). It simulate a bunch of modules loaded from server and a page where to place them (on the right). 

# Installation
```javascript
bower install robojs
npm install robojs
```


# How it works.
You set a `data-mediator` attribute with an ID (whatever you want)
```html
    <div data-mediator="my-mediator">a-2</div>
    
```
in `definitions.js` you define a Map where the key is an ID , and the value is the file to request in order to register the element.

```json
	{
        "my-mediator": "component/mediator"
    }
```

By default `robojs` supposes the presence of an AMD Loader like `RequireJS` in order to request the component and its dependencies.
For example "component/mediator" looks like the follow

```javascript

define(function(){
    return function Mediator(node){
        //
    }
})

```

When `robojs` finds a match between a `data-mediator` attribute and an ID from `definitions.js`,
it will load `component/mediator.js` file and it will execute the `Mediator` function.
The `node` parameter is a reference to the DOM element.


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

 

# Loader Object
Default loader is `AMD` based, it means that by default any module should be exported as amd.
You can customize script loading strategy passing a function to `Loader`.

For instance if you use  `SystemJS` module loader, you can do something like the follow.

```javascript
import {bootstrap,Loader} from "robojs"
//this is the strategy used to load external modules
function loaderFn(id, resolve, reject) {
        return System.import(id).then(resolve).catch(reject)
    }
bootstrap({definitions: definitions,loader:Loader(loaderFn)})
```

and your HTML file can look like this
```html
<script src="system.js"></script>
<script>
	System.config({
		defaultJSExtensions: true,
		paths:{
			robojs:"../../dist/robojs"
		}
	});

	System.import("./client/Application");
</script>
```

An example can be found in sample/systemjs folder.




 

### EventDispatcher Object.
The `EventDispatcher` can be your messaging System. It dispatches and listens to `Events` from your Application. 
It's meant to be a Singleton in your application.

You can get a new instance of EventDispatcher by calling `makeDispatcher` function

```javascript
import {makeDispatcher} from "robojs"
var myNewEventDispatcher=makeDispatcher();
```
	




## RequireJS configuration

This is an example how you can set dependencies using `RequireJS`

```javascript

requirejs.config({
	paths: {		
        robojs: "../../dist/robojs"
	}
});

```
## SystemJS configuration

This is an example how you can set dependencies using `SystemJS`

```javascript

System.config({
		defaultJSExtensions: true,
		paths:{
			robojs:"../../dist/robojs"
		}
	});

```

or using **Globals**
 
> **NB**. If you use robojs as global, you need some kind of script loader. If your project has SystemJS or RequireJS, please don't use global.

```html
<script src="../../dist/robojs.js"></script>
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
no dependencies

### Build project
transpiling es6 sources to es5 is handled by AWESOME project [jspm](http://jspm.io/), that is a package manager for the SystemJS universal module loader, built on top of the dynamic ES6 module loader. 
You can run npm script named `build`.

```
npm run build
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

