"use strict";

var EventEmitter = require("events").EventEmitter;

function Signal() {
    EventEmitter.call(this);
}

Signal.prototype = Object.create(EventEmitter.prototype);

Signal.prototype._value = undefined;

Signal.prototype.get = function () {
    return this._value;
};
Signal.prototype.read = Signal.prototype.get;

Signal.prototype.set = function (value) {
    var oldValue = this._value;

    this._value = value;
    this.emit("readable");

    return oldValue;
};

Signal.prototype.write = function (data, encoding, callback) {
    this.set(data);

    if (typeof encoding === "function") {
        callback = encoding;
    }
    if (callback) {
        setTimeout(callback, 0);
    }

    return true;
};

Signal.prototype.end = function (data, encoding, callback) {
    if (arguments.length > 0) {
        this.write(data, encoding, callback);
    }
    this.emit("end");
};

module.exports = Signal;