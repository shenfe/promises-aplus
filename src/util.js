module.exports = {
    doAsync: function (fn, arg, target) {
        (typeof process === 'undefined' ? setTimeout : process.nextTick)(
            (arguments.length === 1) ? fn : function () {
                fn.apply(target, (arg instanceof Array) ? arg : [arg])
            }
        )
    },
    isFunction: function (v) { return typeof v === 'function' },
    isObject: function (v) { return typeof v === 'object' && v !== null }
};