var asyncRun = function (fn, data) {
    if (data !== undefined) fn = function () { fn(data) };
    if (typeof window !== 'undefined') {
        window.setTimeout(fn, 0);
    } else if (typeof process !== 'undefined') {
        process.nextTick(fn);
    }
};

var isFn = function (fn) { return typeof fn === 'function' };

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
    if (this.status === 1) {
        var p = new Prom();
        if (!isFn(resolver)) return p.resolve(this.data);
        asyncRun(function () {
            try {
                var data = resolver(_this.data);
                p.resolve(data);
            } catch (e) {
                p.reject(e);
            }
        });
        return p;
    } else if (this.status === 2) {
        var p = new Prom();
        if (!isFn(rejecter)) return p.reject(this.data);
        asyncRun(function () {
            try {
                var data = rejecter(_this.data);
                p.reject(data);
            } catch (e) {
                p.reject(e);
            }
        });
        return p;
    } else {
        var p = new Prom();
        var _resolver = this._resolver;
        var _rejecter = this._rejecter;
        this._resolver = function (value) {
            _resolver && _resolver(value);
            try {
                var data = isFn(resolver) ? resolver(value) : value;
                p.resolve(data);
            } catch (e) {
                p.reject(e);
            }
        };
        this._rejecter = function (reason) {
            _rejecter && _rejecter(reason);
            try {
                var data = isFn(rejecter) ? rejecter(reason) : reason;
                p.reject(data);
            } catch (e) {
                p.reject(e);
            }
        };
        return p;
    }
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