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
            notify(signal._listeners, newValue, oldValue, signal);
        }

        return undefined;
    }

    signal._value = value;
    signal.constructor = Signal;
    signal.notify = Signal.prototype.notify;
    signal.unnotify = Signal.prototype.unnotify;
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
 * @param {Function} listener1
 * @param {Function} listener2
 * @param {Function} listener3
 * @returns {Function}
 */
Signal.prototype.notify = function (listener1, listener2, listener3) {
    var i;

    if (!this._listeners) {
        this._listeners = [];
    }

    for (i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] !== "function") {
            throw new TypeError("(Signal) Listener must be typeof function, instead saw '" + typeof arguments[i] + "'");
        }
    }
    Signal.totalListeners += arguments.length;
    this._listeners.push.apply(this._listeners, arguments);

    return this;
};

/**
 * Removes a listener so it will not be notified anymore
 *
 * @param {Function} listener1
 * @param {Function} listener2
 * @param {Function} listener3
 * @returns {Function}
 */
Signal.prototype.unnotify = function (listener1, listener2, listener3) {
    var listeners = this._listeners,
        listener,
        remaining,
        i;

    if (!listeners) {
        return this;
    }

    remaining = [];
    for (i = 0; i < listeners.length; i++) {
        listener = listeners[i];
        if (Array.prototype.indexOf.call(arguments, listener) === -1) {
            remaining.push(listeners[i]);
        }
    }
    this._listeners = remaining;
    Signal.totalListeners -= listeners.length - remaining.length;

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
 * You may call this function multiple times with the same plugin, the plugin will only be applied once.
 *
 * @param {Function} plugin
 * @param {Object=} config
 * @returns {Signal}
 */
Signal.use = function (plugin, config) {
    this._plugins = this._plugins || [];

    if (this._plugins.indexOf(plugin) === -1) {
        plugin(this, config);
        this._plugins.push(plugin);
    }

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
function notify(listeners, newValue, oldValue, target) {
    var i;

    if (!listeners) {
        return;
    }

    for (i = 0; i < listeners.length; i++) {
        listeners[i](newValue, oldValue, target);
    }
}

module.exports = Signal;