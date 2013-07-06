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
        if (newValue instanceof ChangeEvent) {
            newValue = newValue.newValue;
        }
        if (typeof signal.set === "function") {
            newValue = signal.set(newValue);
        }
        signal._value = newValue;
        notify(signal._listeners, new ChangeEvent(signal, oldValue, newValue));

        return undefined;
    }

    signal._value = value;
    signal.constructor = signal.Class = Signal;
    signal.notify = Signal.prototype.notify;
    signal.unnotify = Signal.prototype.unnotify;
    signal.set = Signal.prototype.set;
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
 * Override this setter if you want to perform some action every time the
 * value is changed. The setter is called with the new value and the returned value
 * will be the signal's new value, so be sure to always return something.
 *
 * @param newValue
 * @returns {*}
 */
Signal.prototype.set = function (newValue) {
    return newValue;
};

/**
 * Deletes the internal value and removes all listeners. Use this function
 * if you don't want to use the signal anymore.
 */
Signal.prototype.dispose = function () {
    if (this._listeners) {
        Signal.totalListeners -= this._listeners.length;
    }

    delete this._value;
    delete this._listeners;
};

/**
 * The ChangeEvent gets passed to all listeners when a change occurs.
 *
 * @param {Function} target
 * @param oldValue
 * @param newValue
 * @constructor
 */
function ChangeEvent(target, oldValue, newValue) {
    this.target = target;
    this.oldValue = oldValue;
    this.newValue = newValue;
}

/**
 * @type {string}
 */
ChangeEvent.prototype.name = "change";

/**
 * The signal that emitted the change event
 * @type {Function}
 */
ChangeEvent.prototype.target = null;

/**
 * The previous value
 * @type {*}
 */
ChangeEvent.prototype.oldValue = null;

/**
 * The current value
 * @type {*}
 */
ChangeEvent.prototype.newValue = null;

/**
 * Notifies the given listeners with the given event object
 *
 * @private
 * @param {Array} listeners
 * @param {Object} event
 */
function notify(listeners, event) {
    var i;

    if (!listeners) {
        return;
    }

    for (i = 0; i < listeners.length; i++) {
        listeners[i].call(event.target, event);
    }
}

module.exports = Signal;