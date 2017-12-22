var isValidState = function (state) {
    return state === 0 || state === 1 || state === 2;
};

var Utils = {
    runAsync: function (fn) {
        setTimeout(fn, 0);
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
        promise.settle(2, new TypeError('The promise and its value refer to the same object'));
    } else if (Utils.isPromise(x)) {
        if (x.state === 0) {
            x.then(function (val) {
                Resolve(promise, val);
            }, function (reason) {
                promise.settle(2, reason);
            });
        } else {
            promise.settle(x.state, x.value);
        }
    } else if (Utils.isObject(x) || Utils.isFunction(x)) {
        var called = false;
        try {
            var thenHandler = x.then;
            if (Utils.isFunction(thenHandler)) {
                thenHandler.call(x,
                        function (y) {
                            if (!called) {
                                Resolve(promise, y);
                                called = true;
                            }
                        },
                        function (r) {
                            if (!called) {
                                promise.reject(r);
                                called = true;
                            }
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

var Prom = function (fn) {
    this.value = null;
    this.state = 0;
    this.queue = [];
    this._resolve = null;
    this._reject = null;

    var _this = this;
    if (fn) {
        fn(function (value) {
            Resolve(_this, value);
        }, function (reason) {
            _this.reject(reason);
        });
    }
};

Prom.prototype.then = function (onFulfilled, onRejected) {
    var p = new Prom();
    if (Utils.isFunction(onFulfilled)) {
        p._resolve = onFulfilled;
    }

    if (Utils.isFunction(onRejected)) {
        p._reject = onRejected;
    }

    this.queue.push(p);
    if (this.state !== 0) this.process();

    return p;
};

Prom.prototype.settle = function (state, value) {
    if (this.state === state || this.state !== 0) return;

    this.value = value;
    this.state = state;
    if (this.state !== 0) this.process();
};

Prom.prototype.process = function () {
    var _this = this;
    Utils.runAsync(function () {
        var p;
        var value;
        while (p = _this.queue.shift()) {
            value = _this.value;
            if (_this.state === 1 && p._resolve) {
                try {
                    value = p._resolve.call(undefined, value);
                } catch (e) {
                    p.settle(2, e);
                    continue;
                }
            } else if (_this.state === 2) {
                if (!p._reject) {
                    p.settle(2, value);
                    continue;
                }
                try {
                    value = p._reject.call(undefined, value);
                } catch (e) {
                    p.settle(2, e);
                    continue;
                }
            }

            Resolve(p, value);
        }
    });
};

Prom.prototype.resolve = function (value) {
    this.settle(1, value);
};

Prom.prototype.reject = function (reason) {
    this.settle(2, reason);
};

module.exports = Prom;