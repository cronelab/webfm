    const forEachAsync = function (arr, f, config) {
        var batchSize = 100;
        var onbatch = function (i, n) {};
        if (config) {
            batchSize = config.batchSize || batchSize;
            onbatch = config.onbatch || onbatch;
        }
        return new Promise(function (resolve, reject) {

            (function worker(start) {
                setTimeout(function () {
                    var nextStart = start + batchSize;
                    for (var i = start; i < nextStart; i++) {
                        if (i >= arr.length) {
                            resolve();
                            return;
                        }
                        f(arr[i], i, arr);
                    }
                    onbatch(nextStart, arr.length);
                    worker(nextStart);
                }, 0);
            })(0);
        });
    };


    const debounce = function (func, wait, immediate) {
        var timeout;
        return function () {
            var context = this,
                args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };


    module.exports = {
        forEachAsync,
        debounce
    };