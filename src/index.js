var Util = require('./util');

var Resolve = function (promise, x) {
    if (promise === x) { // 2.3.1
        TransitionPromise(promise, 2, new TypeError('The promise and its value refer to the same object.'));
    } else if (x && x.constructor === Prom) { // 2.3.2
        if (x.state === 0) { // 2.3.2.1
            x.then(function (value) { Resolve(promise, value) },
                function (reason) { TransitionPromise(promise, 2, reason) });
        } else
            TransitionPromise(promise, x.state, x.value); // 2.3.2.2, 2.3.2.3
    } else if (Util.isObject(x) || Util.isFunction(x)) { // 2.3.3
        var called = false;
        try {
            var xthen = x.then; // 2.3.3.1
            if (Util.isFunction(xthen)) { // 2.3.3.3
                xthen.call(x, function (y) { // 2.3.3.3.1
                        if (called) return; // 2.3.3.3.3
                        Resolve(promise, y);
                        called = true;
                    }, function (r) { // 2.3.3.3.2
                        if (called) return; // 2.3.3.3.3
                        TransitionPromise(promise, 2, r);
                        called = true;
                    });
            } else { // 2.3.3.4
                TransitionPromise(promise, 1, x);
                called = true;
            }
        } catch (e) { // 2.3.3.2, 2.3.3.3.4
            if (!called) {
                TransitionPromise(promise, 2, e);
                called = true;
            }
        }
    } else
        TransitionPromise(promise, 1, x); // 2.3.4
};

var ThenPromise = function (promise2, promise1state, promise1value) {
    if (promise1state !== 0 && promise2.callbacks[promise1state]) { // 2.2.2, 2.2.3
        var value;
        try {
            value = promise2.callbacks[promise1state].call(undefined, promise1value); // 2.2.5
        } catch (e) {
            TransitionPromise(promise2, 2, e); // 2.2.7.2
            return;
        }
        Resolve(promise2, value); // 2.2.7.1
    } else if (promise1state === 1 && !promise2.callbacks[1]) // 2.2.1.1
        Resolve(promise2, promise1value); // 2.2.7.3
    else if (promise1state === 2 && !promise2.callbacks[2]) // 2.2.1.2
        TransitionPromise(promise2, 2, promise1value); // 2.2.7.4
};

var TransitionPromise = function (promise, state, value) {
    if (promise.state !== 0 || state === 0) return; // 2.1.1.1, 2.1.2.1, 2.1.3.1
    promise.state = state;
    promise.value = value; // 2.1.2.2, 2.1.3.2
    Util.doAsync(function () { // 2.2.6
        while (promise.queue.length) ThenPromise(promise.queue.shift(), promise.state, promise.value)
    });
};

var Prom = function (executor) {
    this.state = 0; // 0: pending, 1: fulfilled (resolved), 2: rejected
    this.value = null;
    this.queue = [];
    this.callbacks = {};

    if (Util.isFunction(executor)) {
        var _this = this;
        executor(function (value) { Resolve(_this, value) },
            function (reason) { TransitionPromise(_this, 2, reason) });
    }
};

Prom.prototype.then = function (onFulfilled, onRejected) {
    var p = new Prom();
    p.callbacks[1] = Util.isFunction(onFulfilled) && onFulfilled;
    p.callbacks[2] = Util.isFunction(onRejected) && onRejected;
    (this.state === 0) ? this.queue.push(p) : Util.doAsync(ThenPromise, [p, this.state, this.value]); // 2.2.4
    return p;
};

Prom.prototype.resolve = function (value) {
    Resolve(this, value);
    return this;
};

Prom.prototype.reject = function (reason) {
    TransitionPromise(this, 2, reason);
    return this;
};

require('./extension')(Prom);

module.exports = Prom;
