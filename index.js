var isFn = function (fn) { return typeof fn === 'function' };

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
    asyncRun(function () {
        isFn(_this._onResolved) && _this._onResolved.call(undefined, _this.data);
        _this._onResolved = null;
    });
    return this;
};

Prom.prototype.reject = function (reason) {
    if (!this.settle(2, reason)) return;
    var _this = this;
    asyncRun(function () {
        isFn(_this._onRejected) && _this._onRejected.call(undefined, _this.data);
        _this._onRejected = null;
    });
    return this;
};

Prom.prototype.then = function (onResolved, onRejected) {
    var _this = this;
    var p = new Prom();
    p._onResolved = onResolved;
    p._onRejected = onRejected;
    if (this.status !== 0 && this.data instanceof Prom) {
        return this.data.then(onResolved, onRejected);
    }
    if (this.status === 1) {
        p.resolve(this.data);
    } else if (this.status === 2) {
        p.reject(this.data);
    } else {
        var _onResolved = this._onResolved;
        var _onRejected = this._onRejected;
        asyncRun(function () {
            _this._onResolved = function (data) {
                try {
                    data = isFn(_onResolved) ? _onResolved(data) : data;
                } catch (e) {
                    p.reject(e);
                    return e;
                }
                if (data instanceof Prom) {
                    data.then(function (value) {
                        p.resolve(value);
                    }, function (reason) {
                        p.reject(reason);
                    });
                } else {
                    p.resolve(data);
                }
                return data;
            };
            _this._onRejected = function (data) {
                try {
                    data = isFn(_onRejected) ? _onRejected(data) : data;
                } catch (e) {
                    p.reject(e);
                    return e;
                }
                if (data instanceof Prom) {
                    data.then(function (value) {
                        p.resolve(value);
                    }, function (reason) {
                        p.reject(reason);
                    });
                } else {
                    p.resolve(data);
                }
                return data;
            };
        });
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