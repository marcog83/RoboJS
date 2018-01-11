
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

`robojs` will iterate the DOM trying to match components id with `data-mediator` attributes.
Each time it finds a match, a request is send to load the right script.
The first time the script is loaded from network, while the next one is retrived from cache.
`MutationObserver` is used to handle DOM changes, and when it happens `robojs` iterates over the new added nodes.


# Usage

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
//mediator.js
define(function(){
    return function Mediator(node){
        //
    }
})

```

When `robojs` finds a match between a `data-mediator` attribute and an ID from `definitions.js`,
it will load `component/mediator.js` file and it will execute the `Mediator` function.
The `node` parameter is a reference to the DOM element.


```javascript
import {bootstrap} from "robojs"
const definitions={
     "my-mediator": "component/mediator"
}
//basic usage
bootstrap({definitions}) // return {dispose,promise}

```
you can store, and use later, the returned Object from bootstrap function. 
```javascript
import {bootstrap} from "robojs"
const definitions={
     "my-mediator": "component/mediator"
};
var application=bootstrap({definitions}) // return {dispose:Function,promise:Promise<any>}

//you can handle when every Mediators in page are executed
application.promise.then(function(){
	console.log("all mediators loaded")
}).catch(function(e){
	console.log("something went wrong",e);
})

//later in your code you can dispose the RoboJS instance.
application.dispose();
```




# Mediator Function.
Mediator is the context where your logic runs for a specific Mediator. It is a simple function.
When a `data-mediator` attribute matches an ID from the component definitions the `Mediator` function is called and a function returns.

The returned function is called later when the module will be disposed.
`Mediator` function takes two parameters, `node` and `dispatcher`. `node` is a reference to DOM element, 
`dispatcher` is a reference to `EventDispatcher` Object.

```javascript

    function Mediator(node,dispacther) {
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
const definitions={
     "my-mediator": "component/mediator"
};
//this is the strategy used to load external modules
function loaderFn(id, resolve, reject) {
        System.import(id).then(resolve).catch(reject)
    }
bootstrap({definitions,loader:Loader(loaderFn)})
```

If you use ES2015 `import` statement, you can create something different. 
You don't need to load `Mediator` from external file, but just retrieve the `Mediator` function from `definitions` Map

```javascript
import {bootstrap,Loader} from "robojs"
import Mediator from "./component/mediator";
const definitions={
     "my-mediator": Mediator
};

//this is the strategy used to get Mediator from definitions
function loaderFn(id, resolve, reject) {    
        resolve(definitions[id]);
    }
    
bootstrap({definitions,loader:Loader(loaderFn)});
```

 


 

### EventDispatcher Object.
The `EventDispatcher` can be your messaging System. It dispatches and listens to `Events` from your Application. 
It's meant to be a Singleton in your application. Every robojs instance has one. 

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

## ES2015

```javascript
import {bootstrap} from "robojs"
const definitions={
     "my-mediator": "component/mediator"
};
 
bootstrap({definitions});

```

# Dependencies
no dependencies

### Build project
You can run npm script named `build`.

```
npm run build
```
### Test project
from test folder you can run script named `test`.
```
npm run test
```

### Polyfills  
If you need to support old browsers, you need to something for


1. [MutationObserver](https://github.com/megawac/MutationObserver.js) by megawac.
2. [Webcomponents](https://github.com/webcomponents). If you use custom element extension.
 

