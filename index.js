var Util = {
    doAsync: function (fn, arg, target) {
        setTimeout(function () { fn.call(target, arg) }, 0);
    },
    isFunction: function (val) {
        return typeof val === 'function';
    },
    isObject: function (val) {
        return typeof val === 'object' && val !== null;
    },
    isPromise: function (val) {
        return val && val.constructor === Prom;
    }
};

var Resolve = function (promise, x) {
    if (promise === x) {
        promise.reject(new TypeError('The promise and its value refer to the same object'));
    } else if (Util.isPromise(x)) {
        if (x.state !== 0) {
            SettlePromise(promise, x.state, x.value);
        } else {
            x.then(function (val) {
                Resolve(promise, val);
            }, function (reason) {
                promise.reject(reason);
            });
        }
    } else if (Util.isObject(x) || Util.isFunction(x)) {
        var called = false;
        try {
            var xthen = x.then;
            if (Util.isFunction(xthen)) {
                xthen.call(x,
                    function (y) {
                        if (called) return;
                        Resolve(promise, y);
                        called = true;
                    },
                    function (r) {
                        if (called) return;
                        promise.reject(r);
                        called = true;
                    });
            } else {
                promise.resolve(x);
                called = true;
            }
        } catch (e) {
            if (!called) {
                promise.reject(e);
                called = true;
            }
        }
    } else {
        promise.resolve(x);
    }
};

var RunQueueInPromise = function (promise) {
    var p, value;
    while (p = promise.queue.shift()) {
        value = promise.value;
        if (promise.state === 1 && p._resolver) {
            try {
                value = p._resolver.call(undefined, value);
            } catch (e) {
                p.reject(e);
                continue;
            }
        } else if (promise.state === 2) {
            if (!p._rejecter) {
                p.reject(value);
                continue;
            }
            try {
                value = p._rejecter.call(undefined, value);
            } catch (e) {
                p.reject(e);
                continue;
            }
        }

        Resolve(p, value);
    }
};

var SettlePromise = function (promise, state, value) {
    if (promise.state !== 0 || state === 0) return;
    promise.state = state;
    promise.value = value;
    Util.doAsync(RunQueueInPromise, promise);
};

var Prom = function (fn) {
    this.state = 0;
    this.value = null;
    this.queue = [];
    this._resolver = null;
    this._rejecter = null;

    if (fn) {
        var _this = this;
        fn(function (value) {
            Resolve(_this, value);
        }, function (reason) {
            _this.reject(reason);
        });
    }
};

Prom.prototype.then = function (onFulfilled, onRejected) {
    var p = new Prom();
    p._resolver = Util.isFunction(onFulfilled) && onFulfilled;
    p._rejecter = Util.isFunction(onRejected) && onRejected;
    this.queue.push(p);

    if (this.state !== 0) Util.doAsync(RunQueueInPromise, this);

    return p;
};

Prom.prototype.resolve = function (value) {
    SettlePromise(this, 1, value);
    return this;
};

Prom.prototype.reject = function (reason) {
    SettlePromise(this, 2, reason);
    return this;
};

Prom.resolve = function (value) {
    return new Prom().resolve(value);
};

Prom.reject = function (reason) {
    return new Prom().reject(reason);
};

module.exports = Prom;