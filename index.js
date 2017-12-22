var isFn = function (fn) { return typeof fn === 'function' };
var isThenable = function (obj) { return (typeof obj === 'object' || isFn(obj)) && isFn(obj.then) };

var asyncRun = function (_fn, data) {
    if (!isFn(_fn)) return;
    var fn = function () { _fn(data) };
    if (typeof window !== 'undefined') {
        window.setTimeout(fn, 0);
    } else if (typeof process !== 'undefined') {
        process.nextTick(fn);
    }
};

var Prom = function () {
    this.status = 0; // 0: pending, 1: resolved, 2: rejected
    this.data = undefined;
};

Prom.prototype.settle = function (code, data) {
    if (this.status !== 0) return false;
    this.status = code;
    this.data = data;
    return true;
};

Prom.prototype.resolve = function (value) {
    if (!this.settle(1, value)) return;
    var _this = this;
    // asyncRun(function () {
        isFn(_this._onResolved) && _this._onResolved.call(undefined, _this.data);
        _this._onResolved = null;
    // });
    return this;
};

Prom.prototype.reject = function (reason) {
    if (!this.settle(2, reason)) return;
    var _this = this;
    // asyncRun(function () {
        if (isFn(_this._onRejected)) _this._onRejected.call(undefined, _this.data);
        _this._onRejected = null;
    // });
    return this;
};

var pr = function (p, status, data, fn1, fn2, async) {
    var fn = function () {
        try {
            if (status === 1) {
                if (isFn(fn1)) data = fn1(data);
            } else {
                if (isFn(fn2)) {
                    status = 1;
                    data = fn2(data);
                }
            }
        } catch (e) {
            status = 2;
            data = e;
        }
        p[status === 1 ? 'resolve' : 'reject'](data);
    };
    async ? asyncRun(fn) : fn();
};

Prom.prototype.then = function (onResolved, onRejected) {
    var _this = this;
    var p = new Prom();
    if (this.status !== 0 && isThenable(this.data)) {
        return this.data.then(onResolved, onRejected);
    }
    if (this.status !== 0) {
        pr(p, _this.status, _this.data, onResolved, onRejected, true);
    } else {
        var _onResolved = this._onResolved;
        var _onRejected = this._onRejected;
        this._onResolved = function (data) {
            try {
                data = isFn(_onResolved) ? _onResolved(data) : data;
            } catch (e) {
                pr(p, 2, e, undefined, onRejected, true);
                return e;
            }
            if (isThenable(data)) {
                data.then(function (value) {
                    pr(p, 1, value, onResolved, undefined, true);
                }, function (reason) {
                    pr(p, 1, reason, onRejected, undefined, true);
                });
            } else {
                pr(p, 1, data, onResolved, undefined, true);
            }
            return data;
        };
        this._onRejected = function (data) {
            try {
                data = isFn(_onRejected) ? _onRejected(data) : data;
            } catch (e) {
                pr(p, 2, e, undefined, onRejected, true);
                return e;
            }
            if (isThenable(data)) {
                data.then(function (reason) {
                    pr(p, 2, reason, undefined, onRejected, true);
                });
            } else {
                pr(p, 2, data, undefined, onRejected, true);
            }
            return data;
        };
    }
    return p;
};

Prom.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected);
};

Prom.resolve = function (value) {
    return new Prom().resolve(value);
};

Prom.reject = function (reason) {
    return new Prom().reject(reason);
};

module.exports = Prom;