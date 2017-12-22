let Prom = require('./index');

module.exports = {
    resolved: function (value) {
        return new Prom(function (resolve) {
            resolve(value);
        });
    },
    rejected: function (reason) {
        return new Prom(function (resolve, reject) {
            reject(reason);
        });
    },
    deferred: function () {
        var resolve, reject;
        return {
            promise: new Prom(function (rslv, rjct) {
                resolve = rslv;
                reject = rjct;
            }),
            resolve: resolve,
            reject: reject
        };
    }
};