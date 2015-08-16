![alamid-signal](https://raw.githubusercontent.com/peerigon/alamid-signal/master/img/signal-icon.svg)

alamid-signal
=============
**Tiny observables for the browser and node.js**

**alamid-signal** creates a function-wrapper for a value that might change over time. Then you can add listeners that are triggered everytime the value changes:

```javascript
let Signal = import "alamid-signal";

let name = new Signal("Joe");

name(); // 'Joe'
name("Bob");
name(); // 'Bob'

name.pipe((newName, oldName) => {
   console.log(`Signal changed from ${oldName} to ${newName}`);
});

name("Sue"); // prints 'Signal changed from Bob to Sue'
```

**alamid-signal** is pretty close to an `Observable` you might know from libraries such as Knockout. However, it is not bound to the DOM and can be used in any JavaScript environment. 

[![Build Status](https://secure.travis-ci.org/peerigon/alamid-signal?branch=master)](http://travis-ci.org/peerigon/alamid-signal)
[![Dependency Status](https://david-dm.org/peerigon/alamid-signal/status.png)](http://david-dm.org/peerigon/alamid-signal)

<br />

Installation
------------

`npm install alamid-signal`

<br />

Why using signals?
------------------

Signals are like tiny `EventEmitter`s that only emit `change`-events. They allow you to write your code in a reactive, flow-based style. With signals you can write black-box components that take input signals, do transformations on the value and return output signals.

![sketch-1](https://raw.githubusercontent.com/peerigon/alamid-signal/master/img/signal-sketch-1.svg)

--

![sketch-2](https://raw.githubusercontent.com/peerigon/alamid-signal/master/img/signal-sketch-2.svg)

--

![sketch-3](https://raw.githubusercontent.com/peerigon/alamid-signal/master/img/signal-sketch-3.svg)

With all these isolated and well-tested black-box components, you can build up your application just by wiring the signals together.

Due to their extreme simple API, they come in handy for exchanging time-based values between two components without requiring too much knowledge about their implementation. And since signals are just plain functions which are copied by reference, you can simply pass around signals as "live" values.



<br />

Examples
--------

### View with normalized input

```javascript
function EmailForm() {
    // value will be our raw input signal.
    this.value = new Signal("");
    
    // email will be our normalized output signal, hence read-only
    this.email = new Signal("");
    this.email.transform = (str) => str.trim().toLowerCase();
    this.email.readOnly = true;
    
    this.value.pipe(this.email);
    this.value.pipe((newValue) => {
        this._inputElement.value = newValue;
    });
    this._inputElement.addEventListener("keyup", () => {
        this.value(this._inputElement.value);
    });
}
```


Now `value` represents the current value of the input field (the "view model"). Other views are able to read and set that value without knowing about the actual DOM element. `email`, however, represents the same value but with a normalization applied, which is usually more useful for the model layer.

### Request-dependent process manager

Create or kill a new process for every 100th concurrent request.

```javascript
let numOfRequests = new Signal(0);

http.createServer(function (req, res) {
    let end = res.end;

    numOfRequests(numOfRequests() + 1);
    res.end = function () {
        numOfRequests(numOfRequests() - 1);
        end.apply(this, arguments);
    };
});

export { numOfRequests as numOfRequests };
```


```javascript
let numOfProcesses = new Signal(0);

numOfProcesses.pipe((newValue, oldValue) => {
    let diff = newValue - oldValue;
    // diff can't be 0 because alamid-signal does only trigger
    // when the primitive value did actually change
    let fn = diff > 0 ? createProcess : killProcess;
    
    for (let i = 0; i < diff; i++) fn();
});

export { numOfProcesses as numOfProcesses };
```

```javascript
import numOfRequests from "./server.js";
import numOfProcesses from "./process.js";

// Wire together both signals
numOfRequests.pipe((numOfRequests) => {
    numOfProcesses(Math.ceil(numOfRequests / 100));
});
```

<br />

API
----

### Signal(initialValue: *): Function

Creates a new signal with the given initial value.

### Signal.totalListeners: Number

Indicates the number of all listeners on all signal instances. Use this property to track down memory leaks.

### Signal.use(plugin: Function): this

Applies an [alamid-plugin](https://github.com/peerigon/alamid-plugin) in order to extend the functionality.

### Signal.prototype.readOnly: Boolean

Boolean flag that indicates if a new value can be written to the signal by invoking the signal. If true, the signal will only receive new values by piping to it.

### Signal.prototype.transform: null

Override this function if you want to transform the value before it is set. `transform()` is called with the new value and the returned value will be the signal's new value, so be sure to always return something.

### Signal.prototype.pipe(listener: Function): listener

Adds new listeners that will be called if the value changes. A listener can be another signal or just an arbitrary function. The listener will be called with the new value as first argument, the old as second and the calling signal as third. Returns the given listener to ease chaining (like node's `pipe()` method).

### Signal.prototype.unpipe(listener: Function): listener

Removes the given listener and returns it to ease chaining (like node's `pipe()` method).

### Signal.prototype.dispose(): undefined

Prepares the signal to be garbage collected. Clears all references by removing all listeners and resetting the internal value. Call this function when you don't need the signal anymore.


<br />

Inheritance
-----------

Since a signal is basically just a function, it is not possible to use prototype inheritance. Hence, the best way to achieve inheritance is by using constructor functions:

```javascript
function SpecialSignal() {
	Signal.apply(this, arguments);
	
	// Overriding the default transformer
	this.transform = () => {
		...
	};
	// Extending the signal with additional methods
	this.specialMethod = () => {
		...
	};
}
```

<br />

Contributing
------------

From opening a bug report to creating a pull request: **every contribution is appreciated and welcome**. If you're planing to implement a new feature or change the api please create an issue first. This way we can ensure that your precious work is not in vain.

All pull requests should have 100% test coverage (with notable exceptions) and need to pass all tests.

- Call `npm test` to run the unit tests
- Call `npm run coverage` to check the test coverage (using [istanbul](https://github.com/gotwarlost/istanbul))  

<br />

License
------------------------------------------------------------------------

MIT