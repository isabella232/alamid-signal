"use strict";

var EventEmitter = require("events").EventEmitter;

function Signal() {
    EventEmitter.call(this);

    if (!Signal.dev) {
        this.setMaxListeners(Infinity);
    }
}

Signal.prototype = Object.create(EventEmitter.prototype);

Signal.prototype._value = undefined;

Signal.prototype.get = function () {
    return this._value;
};

Signal.prototype.set = function (value) {
    var oldValue = this._value;

    this._value = value;
    this.emit("change", new ChangeEvent(this, oldValue, value));

    return this;
};

Signal.dev = false;

function ChangeEvent(target, oldValue, newValue) {
    this.target = target;
    this.oldValue = oldValue;
    this.newValue = newValue;
}

ChangeEvent.prototype.name = "change";

module.exports = Signal;