var Util = require('./util');

module.exports = function (Prom) {
    /* Prototype methods */

    Prom.prototype['catch'] = function (onRejected) {
        return this.then(undefined, onRejected);
    };

    // https://www.promisejs.org/api/
    Prom.prototype.done = function (onFulfilled, onRejected) {
        var _this = arguments.length ? this.then.apply(this, arguments) : this;
        _this.then(undefined, function (err) {
            Util.doAsync(function () { throw err });
        });
    };

    Prom.prototype['finally'] = function (fn) {
        if (!Util.isFunction(fn)) return this;
        fn = function (value) {
            return Prom.resolve(fn()).then(function () {
                return value;
            });
        };
        return this.then(fn, fn);
    };

    /* Static methods */

    Prom.resolved = Prom.resolve = function (value) {
        return new Prom(function (resolve) {
            resolve(value);
        });
    };

    Prom.rejected = Prom.reject = function (reason) {
        return new Prom(function (_, reject) {
            reject(reason);
        });
    };

    Prom.deferred = function () {
        var _resolve, _reject;
        return {
            promise: new Prom(function (resolve, reject) {
                _resolve = resolve;
                _reject = reject;
            }),
            resolve: _resolve,
            reject: _reject
        };
    };

    Prom.all = function (arr) {
        var ps = Array.prototype.slice.call(arr);
        return new Prom(function (resolve, reject) {
            if (ps.length === 0) return resolve([]);
            var total = ps.length, remain = ps.length;
            for (var i = 0; i < total; i++) {
                Prom.resolved(ps[i]).then(function (value) {
                    ps[i] = value;
                    remain--;
                    if (remain === 0) resolve(ps);
                }, reject);
            }
        });
    };

    Prom.race = function (arr) {
        var ps = Array.prototype.slice.call(arr);
        return new Prom(function (resolve, reject) {
            if (ps.length === 0) return resolve(null);
            for (var i = 0, total = ps.length; i < total; i++)
                Prom.resolve(ps[i]).then(resolve, reject);
        });
    };
};