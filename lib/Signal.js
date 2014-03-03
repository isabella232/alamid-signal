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
            return signal._write(newValue);
        }
    }

    Signal.prototype.constructor.apply(signal, arguments);

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
 * Calls the given function with the Signal as first argument and the given config (optionally). Plugins can be used
 * to hook into class methods by overriding them.
 *
 * It is save to call this function multiple times with the same plugin, the plugin will only be applied once.
 *
 * @param {Function} plugin
 * @param {Object=} config
 * @returns {Function}
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
 * Will be called for every instance. Override this method to hook into construction.
 *
 * @param {*} value
 */
Signal.prototype.constructor = function (value) {
    var proto = Signal.prototype,
        key;

    this._value = value;
    this.constructor = Signal;

    for (key in proto) {
        if (proto.hasOwnProperty(key)) {
            this[key] = proto[key];
        }
    }
};

/**
 * Adds new listeners that will be called if the value changes.
 *
 * @param {Function} listener
 * @returns {Function}
 */
Signal.prototype.notify = function (listener) {
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
Signal.prototype.unnotify = function (listener) {
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
 * Adds the given listener via .notify() and returns the listener again. Useful for
 * chaining multiple signals.
 *
 * @param {Function} listener
 * @returns {Function}
 */
Signal.prototype.pipe = function (listener) {
    this.notify(listener);

    return listener;
};

/**
 * Notify all listeners manually.
 *
 * @returns {Signal}
 */
/*Signal.prototype.trigger = function () {
    trigger(this._listeners, this._value, this._value, this);

    return this;
};*/

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
 * @returns {undefined}
 * @private
 */
Signal.prototype._write = function (newValue) {
    var oldValue = this._value;

    if (typeof this.setter === "function") {
        newValue = this.setter(newValue);
    }

    if (isPrimitive(newValue) && isPrimitive(oldValue) && newValue === oldValue) {
        return undefined;
    }

    this._value = newValue;
    trigger(this._listeners, newValue, oldValue, this);

    return undefined;
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
 * @param {Array} listeners
 * @param {*} newValue
 * @param {*} oldValue
 * @param {Function} target
 */
function trigger(listeners, newValue, oldValue, target) {
    var i;

    if (!listeners) {
        return;
    }

    for (i = 0; i < listeners.length; i++) {
        listeners[i](newValue, oldValue, target);
    }
}

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