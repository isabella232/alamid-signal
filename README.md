// TODO Add Phridge Pending Example 

![alamid-signal](http://localhost:3000/signal-icon.svg)

alamid-signal
=============
**Tiny observables for the browser and node.js**

**alamid-signal** creates a function-wrapper for a value that might change over time. You can add listeners that are triggered when the value changes:

```javascript
var Signal = require("alamid-signal");

var name = new Signal("Joe");

name(); // 'Joe'
name("Bob");
name(); // 'Bob'

name.notify(function (newName, oldName) {
   console.log("Signal changed from", oldName, "to", newName);
});

name("Sue"); // prints 'Signal changed from Bob to Sue'
```

**alamid-signal** is pretty close to an `Observable` you might know from Knockout. However, it is not bound to a DOM environment and can be used in any JavaScript application. 

[![Build Status](https://secure.travis-ci.org/peerigon/alamid-signal?branch=master)](http://travis-ci.org/peerigon/alamid-signal)
[![Dependency Status](https://david-dm.org/peerigon/alamid-signal/status.png)](http://david-dm.org/peerigon/alamid-signal)

<br />

Installation
------------

`npm install alamid-signal`

<br />

About signals
-------------

Signals allow you to write your code in a reactive, flow-based instead of imperative style. They're like tiny `EventEmitter`s that only emit one `change`-event. If applied right they lead to a much cleaner and simpler code.

Since their extreme simple api they come in handy for exchanging variable values between two components without requiring too much knowledge behind their implementation. With signals you can write black-box components that take an input signal, do transformations on the value and return an output signal.

![signal component](http://localhost:3000/signal-component.svg)

<br />

Examples
-------------

### Concurrent requests

Spin up a new api instance every 100 concurrent requests.

```javascript
var numOfRequests = new Signal(0);

http.createServer(function (req, res) {
    var end = res.end;

    numOfRequests(numOfRequests() + 1);
    res.end = function () {
        numOfRequests(numOfRequests() - 1);
        end.apply(this, arguments);
    };
});
```

```javascript
var byHundred = new Signal(0);

byHundred.transform = function (num) {
    return Math.floor(num / 1000);
};
```

```javascript
var floor = new Signal(0);

floor.transform = function (num) {
    return Math.floor(num);
};
```

```javascript
function manageInstances(numOfInstances) {
    numOfInstances.notify(function (newNum, oldNum) {
        if (newNum > oldNum) {
            spinUpNewInstance();
        } else {
            tearDownInstance();
        }
    });
}
```

```javascript
numOfRequest
   .pipe(byHundred)
   .pipe(floor)
   .pipe(manageInstances);
```

### Input field

Normalize the content of an email input field.

```javascript
var email = new Signal(""),
    inputField = document.getElementById("input-email"); 

inputField.addEventListener("keyup", function () {
    email(inputField.value);
});
```

```javascript
var trim = new Signal("");

trim.transform = function (str) {
   return str.trim();
};
```

```javascript
var toLowerCase = new Signal("");

toLowerCase.transform = function (str) {
    return str.toLowerCase();
};
```

```javascript
email
    .pipe(trim)
    .pipe(toLowerCase);
```