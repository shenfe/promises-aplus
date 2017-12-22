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
        isFn(_this._resolver) && _this._resolver.call(undefined, _this.data);
    });
    return this;
};

Prom.prototype.reject = function (reason) {
    if (!this.settle(2, reason)) return;
    var _this = this;
    asyncRun(function () {
        isFn(_this._rejecter) && _this._rejecter.call(undefined, _this.data);
    });
    return this;
};

Prom.prototype.then = function (resolver, rejecter) {
    var _this = this;
    var p = new Prom();
    p._resolver = resolver;
    p._rejecter = rejecter;
    if (this.status !== 0) {
        p.resolve(this.data);
    } else {
        var _resolver = this._resolver;
        var _rejecter = this._rejecter;
        this._resolver = function (value) {
            var data;
            try {
                data = isFn(_resolver) ? _resolver(value) : value;
            } catch (e) {
                p.reject(e);
                return e;
            }
            p.resolve(data);
            return data;
        };
        this._rejecter = function (reason) {
            var data;
            try {
                data = isFn(_rejecter) ? _rejecter(reason) : reason;
            } catch (e) {
                p.reject(e);
                return e;
            }
            p.resolve(data);
            return data;
        };
    }
    return p;
};

Prom.prototype.catch = function (rejecter) {
    return this.then(undefined, rejecter);
};

Prom.resolve = function (value) {
    return new Prom().resolve(value);
};

Prom.reject = function (reason) {
    return new Prom().reject(reason);
};

module.exports = Prom;