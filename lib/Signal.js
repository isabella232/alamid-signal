"use strict";

/**
 * Creates a new signal. A signal is a function that takes a value and notifies
 * listeners when the value has been changed. Calling the signal without an argument
 * returns the current value.
 *
 * @returns {Function}
 * @param {*} value will be the initial value of the signal
 * @constructor
 */
function Signal(value) {
    function signal(newValue) {
        var oldValue;

        if (arguments.length === 0) {
            return signal._value;
        }

        oldValue = signal._value;

        if (typeof signal.setter === "function") {
            newValue = signal.setter(newValue);
        }

        if (newValue !== oldValue) {
            signal._value = newValue;
            subscribe(signal._listeners, newValue, oldValue, signal);
        }

        return undefined;
    }

    signal._value = value;
    signal.constructor = Signal;
    signal.subscribe = Signal.prototype.subscribe;
    signal.unsubscribe = Signal.prototype.unsubscribe;
    signal.trigger = Signal.prototype.trigger;
    signal.setter = Signal.prototype.setter;
    signal.dispose = Signal.prototype.dispose;

    return signal;
}

/**
 * Represents the number of listeners that are currently active on all instances. Use this
 * number to track memory leaks caused by forgotten listeners.
 *
 * @type {number}
 */
Signal.totalListeners = 0;

/**
 * Adds new listeners that will be called if the value changes.
 *
 * @param {Function} listener
 * @returns {Function}
 */
Signal.prototype.subscribe = function (listener) {
    if (!this._listeners) {
        this._listeners = [];
    }

    if (typeof listener !== "function") {
        throw new TypeError("(Signal) Listener must be typeof function, instead saw '" + typeof listener + "'");
    }
    Signal.totalListeners += 1;
    this._listeners.push(listener);

    return this;
};

/**
 * Removes a listener so it will not be notified anymore
 *
 * @param {Function} listener
 * @returns {Function}
 */
Signal.prototype.unsubscribe = function (listener) {
    var listeners = this._listeners,
        i;

    if (!listeners) {
        return this;
    }

    for (i = 0; i < listeners.length; i++) {
        if (listeners[i] === listener) {
            listeners.splice(i, 1);
            Signal.totalListeners -= 1;
            return this;
        }
    }


    return this;
};

/**
 * Notify all listeners manually.
 *
 * This may be useful in particular when working with objects and arrays where the reference
 * itself stays the same.
 *
 * @returns {Signal}
 */
Signal.prototype.trigger = function () {
    subscribe(this._listeners, this._value, this._value, this);

    return this;
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
 * Override this setter if you want to transform the value before it is set
 * The setter is called with the new value and the returned value
 * will be the signal's new value, so be sure to always return something.
 *
 * @param newValue
 * @returns {*}
 */
Signal.prototype.setter = null;

/**
 * Calls the given function with the Signal as first argument and the given config (optionally). Plugins can be used
 * to hook into class methods by overriding them.
 *
 * @param {Function} plugin
 * @param {Object=} config
 * @returns {Signal}
 */
Signal.use = function (plugin, config) {
    plugin(this, config);

    return this;
};

/**
 * Notifies the given listeners with the given event object
 *
 * @private
 * @param {Array} listeners
 * @param {*} newValue
 * @param {*} oldValue
 * @param {Function} target
 */
function subscribe(listeners, newValue, oldValue, target) {
    var i;

    if (!listeners) {
        return;
    }

    for (i = 0; i < listeners.length; i++) {
        listeners[i](newValue, oldValue, target);
    }
}

module.exports = Signal;