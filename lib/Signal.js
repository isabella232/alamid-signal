"use strict";

/**
 * Creates a new signal. A signal is a function that takes a value and notifies
 * listeners when the value has been changed. Calling the signal without an argument
 * returns the current value.
 *
 * If the signal represents a primitive value and the new primitive value equals (===)
 * the old value the signal will not trigger. Otherwise it will always trigger when the
 * signal is called with a value.
 *
 * @returns {Function}
 * @param {*} value will be the initial value of the signal
 * @constructor
 */
function Signal(value) {
    function signal(newValue) {
        if (arguments.length === 0) {
            return signal._read();
        } else {
            if (!signal.readOnly) {
                signal._write(newValue);
            }
            return undefined;
        }
    }

    Signal.prototype.constructor.apply(signal, arguments);

    return signal;
}

/**
 * Represents the number of listeners that are currently active on all instances. Use this
 * number to track down memory leaks caused by forgotten listeners.
 *
 * @type {number}
 */
Signal.totalListeners = 0;

/**
 * Calls the given function with 'this'  as first argument and the given config (optionally) as second.
 * Plugins can be used to hook into object methods by overriding them.
 *
 * @param {Function} plugin
 * @param {Object=} config
 * @returns {Function}
 */
Signal.use = function (plugin, config) { /* jshint validthis: true */
    plugin(this, config);

    return this;
};

/**
 * Boolean flag that indicates if a new value can be written to the signal by
 * invoking the signal.
 * If true, the signal will only receive new values by piping to it.
 *
 * @type {boolean}
 */
Signal.prototype.readOnly = false;

/**
 * Override this function if you want to transform the value before it is set
 * .transform() is called with the new value and the returned value
 * will be the signal's new value, so be sure to always return something.
 *
 * @param newValue
 * @returns {*}
 */
Signal.prototype.transform = null;

/**
 * The current signal value that will be returned when the signal is read.
 *
 * @type {*}
 * @private
 */
Signal.prototype._value = null;

/**
 * Will be called for every instance. Override this method to hook into construction.
 *
 * @param {*} value
 */
Signal.prototype.constructor = function (value) {
    var proto = Signal.prototype;
    var key;

    for (key in proto) {
        if (proto.hasOwnProperty(key)) {
            this[key] = proto[key];
        }
    }

    this._value = value;
    this.constructor = Signal;
};

/**
 * Adds new listeners that will be called if the value changes. A listener can be another signal
 * or just an arbitrary function. The listener will be called with the new value as first argument
 * and the old as second.
 *
 * @param {Function} listener
 * @returns {Function} the given listener (for chaining)
 */
Signal.prototype.pipe = function (listener) {
    if (!this._listeners) {
        // Lazy init _listeners
        this._listeners = [];
    }

    if (typeof listener !== "function") {
        throw new TypeError("(Signal) Listener must be typeof function, instead saw '" + typeof listener + "'");
    }
    Signal.totalListeners += 1;
    this._listeners.push(listener);

    return listener;
};

/**
 * Removes a listener so it will not be notified anymore
 *
 * @param {Function} listener
 * @returns {Function} the given listener (for chaining)
 */
Signal.prototype.unpipe = function (listener) {
    var listeners = this._listeners;
    var i;

    if (!listeners) {
        return listener;
    }

    for (i = 0; i < listeners.length; i++) {
        if (listeners[i] === listener) {
            listeners.splice(i, 1);
            Signal.totalListeners -= 1;
            break;
        }
    }


    return listener;
};

/**
 * Deletes the internal value and removes all listeners. Use this function
 * if you don't want to use the signal anymore.
 */
Signal.prototype.dispose = function () {
    if (this._listeners) {
        Signal.totalListeners -= this._listeners.length;
    }

    this._value = null;
    this._listeners = null;
};

/**
 * Will be called when a new value is about to be written.
 *
 * @param {*} newValue
 * @private
 */
Signal.prototype._write = function (newValue) {
    var oldValue = this._value;

    if (typeof this.transform === "function") {
        newValue = this.transform(newValue);
    }

    if (isPrimitive(newValue) && isPrimitive(oldValue) && newValue === oldValue) {
        return;
    }

    this._value = newValue;
    this._trigger(newValue, oldValue, this);
};

/**
 * Will be called when a value is read.
 *
 * @returns {*}
 * @private
 */
Signal.prototype._read = function () {
    return this._value;
};

/**
 * Notifies the given listeners with the given arguments
 *
 * @private
 * @param {*} newValue
 * @param {*} oldValue
 * @param {Function} target
 */
Signal.prototype._trigger = function (newValue, oldValue, target) {
    var listeners = this._listeners;
    var listener;
    var i;

    if (!listeners) {
        return;
    }

    for (i = 0; i < listeners.length; i++) {
        listener = listeners[i];
        // Prefer _write method of listener.
        // This way we are able to set a value on another signal although it is readOnly.
        if (typeof listener._write === "function") {
            listener._write(newValue, oldValue, target);
        } else {
            listener(newValue, oldValue, target);
        }
    }
};

/**
 * @private
 * @param {*} value
 * @returns {boolean}
 */
function isPrimitive(value) {
    if (!value) {
        return true;
    }

    return typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean";
}

module.exports = Signal;