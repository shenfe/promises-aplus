var asyncRun = function (fn, data) {
    if (data !== undefined) fn = function () { fn(data) };
    if (typeof window !== 'undefined') {
        window.setTimeout(fn, 0);
    } else if (typeof process !== 'undefined') {
        process.nextTick(fn);
    }
};

var isFn = function (fn) { return typeof fn === 'function' };

var Prom = function (executor) {
    this.status = 0; // 0: pending, 1: resolved, 2: rejected
    this.data = undefined;

    this.handlers = [];

    isFn(executor) && executor(this.resolve, this.reject);
};

Prom.prototype.settle = function (code, data) {
    if (this.status !== 0) return;
    this.status = code;
    this.data = data;
    var _this = this;
    asyncRun(function () {
        var data = _this.data;
        while (_this.handlers.length) {
            var handler = _this.handlers.shift();
            var resolver = handler.resolver;
            var rejecter = handler.rejecter;
            if (data instanceof Prom) {
                if (code === 1)
                    data = data.then(handler.resolver, handler.rejecter);
                else
                    data = data.catch(handler.rejecter);
            } else {
                if (code === 1) {
                    // try {
                        data = resolver(data);
                    // } catch (e) {
                        // code = 2;
                        // data = rejecter(e);
                    // }
                } else {
                    // try {
                        data = rejecter(data);
                    // } catch (e) {
                        // data = rejecter(e);
                    // }
                }
            }
        }
    });
};

Prom.prototype.resolve = function (value) {
    this.settle(1, value);
};

Prom.prototype.reject = function (reason) {
    this.settle(2, reason);
};

Prom.prototype.then = function (resolver, rejecter) {
    var _this = this;
    if (this.status === 1) {
        var data = isFn(resolver) ? resolver(this.data) : this.data;
        if (data instanceof Prom) return data;
        return Prom.resolve(data);
    } else if (this.status === 2) {
        var data = isFn(rejecter) ? rejecter(this.data) : this.data;
        if (data instanceof Prom) return data;
        return Prom.reject(data);
    } else {
        this.handlers.push({
            resolver,
            rejecter
        });
        return this;
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