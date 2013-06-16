"use strict";

var Signal = require("./Signal.js");

function SuperSignal() {
    this._signals = {};
}

SuperSignal.prototype.set = function (key, value) {
    var obj;

    if (arguments.length === 1) {
        obj = key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                this._set(key, obj[key]);
            }
        }
    } else {
        this._set(key, value);
    }

    return this;
};

SuperSignal.prototype._set = function (key, value) {
    var signal = this._signals[key];

    if (signal instanceof Signal) {
        signal.set(value);
    } else {
        this._signals[key] = value;
    }
};

SuperSignal.prototype.get = function (key) {
    var obj,
        result;

    if (arguments.length === 0) {
        obj = this._signals;
        result = {};
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = this._get(key);
            }
        }
        return result;
    }

    return this._get(key);
};

SuperSignal.prototype._get = function (key) {
    var signal = this._signals[key];

    return signal instanceof Signal? signal.get() : signal;
};

SuperSignal.prototype.provide = function (key) {
    var signal = this._signals[key];

    if (signal instanceof Signal === false) {
        signal = new Signal();
        signal.set(this._get(key));
        this._signals[key] = signal;
    }

    return signal;
};

module.exports = SuperSignal;