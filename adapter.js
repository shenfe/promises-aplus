let Prom = require('./index');

module.exports = {
    deferred: function () {
        let p = new Prom();
        return {
            promise: p,
            resolve: function (value) {
                p.resolve(value);
            },
            reject: function (reason) {
                p.reject(reason);
            }
        };
    }
};