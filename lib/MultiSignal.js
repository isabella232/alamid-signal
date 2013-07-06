"use strict";

/**
 * A multisignal groups several signals so they can easily be modified and retrieved.
 *
 * @constructor
 */
function MultiSignal() {
    this._signals = {};
}

/**
 * The signal class. This function will be invoked with "new" everytime a signal
 * is retrieved.
 *
 * @type {Function}
 */
MultiSignal.prototype.Signal = null;

/**
 * Set a single or multiple values with one call.
 *
 * @param {String|Object} key or an object with key/value-pairs
 * @param {*} value
 * @returns {MultiSignal}
 */
MultiSignal.prototype.set = function (key, value) {
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

/**
 * Internal set-method. Will be invoked with key and value. Override this method to modify
 * the way values are set.
 *
 * @private
 * @param {String} key
 * @param {*} value
 * @private
 */
MultiSignal.prototype._set = function (key, value) {
    var signal = this._signals[key];

    if (signal && signal.constructor === this.Signal) {
        signal(value);
    } else {
        this._signals[key] = value;
    }
};

/**
 * Retrieve one or all values.
 *
 * @param {String=} key
 * @returns {*}
 */
MultiSignal.prototype.get = function (key) {
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

/**
 * Internal get method. Override this method if you want to modify the way how values
 * are retrieved.
 *
 * @param {String} key
 * @returns {*}
 * @private
 */
MultiSignal.prototype._get = function (key) {
    var signal = this._signals[key];

    return signal instanceof this.Signal? signal() : signal;
};

/**
 * Returns the signal instance to the given key.
 *
 * @param {String} key
 * @returns {Function}
 */
MultiSignal.prototype.provide = function (key) {
    var signal = this._signals[key];

    if (!signal || signal.constructor !== this.Signal) {
        signal = new this.Signal();
        signal(this._get(key));
        this._signals[key] = signal;
    }

    return signal;
};

module.exports = MultiSignal;