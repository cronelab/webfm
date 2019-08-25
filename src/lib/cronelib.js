class cronelib {
    constructor() {

    }
    forEachAsync(arr, f, config) {

        // TODO Find a better pattern
        var batchSize = 100;
        var onbatch = function (i, n) {};

        if (config) {
            batchSize = config.batchSize || batchSize;
            onbatch = config.onbatch || onbatch;
        }

        return new Promise(function (resolve, reject) {

            // TODO Handle errors inside loop with reject

            (function worker(start) {

                setTimeout(function () {

                    var nextStart = start + batchSize;

                    // Execute f on this block
                    for (var i = start; i < nextStart; i++) {
                        if (i >= arr.length) {
                            // We're done!
                            resolve();
                            return;
                        }
                        // We're not done, so do something
                        f(arr[i], i, arr);
                    }

                    // Call our callback
                    onbatch(nextStart, arr.length);

                    // Move on to next block
                    worker(nextStart);

                }, 0);

            })(0);

        });

    };

    reduceAsync = function (arr, f, a0, config) {

        var initialValue = arr[0];
        var initialIndex = 1;

        if (a0 !== undefined) {
            initialValue = a0;
            initialIndex = 0;
        }

        // TODO Find a better pattern
        var batchSize = 100;
        var onbatch = function (i, n) {};

        if (config) {
            batchSize = config.batchSize || batchSize;
            onbatch = config.onbatch || batchSize;
        }

        return new Promise(function (resolve, reject) {

            // TODO Handle errors inside loop with reject

            (function worker(start, acc) {

                setTimeout(function () {

                    var nextStart = start + batchSize;

                    // Execute f on this block
                    for (var i = start; i < nextStart; i++) {
                        if (i >= arr.length) {
                            // We're done!
                            resolve(acc);
                            return;
                        }
                        // We're not done, so do something
                        acc = f(acc, arr[i], i, arr);
                    }

                    // Call our callback
                    onbatch(nextStart, arr.length);

                    // Move on to next block
                    worker(nextStart, acc);

                }, 0);

            })(initialIndex, initialValue);

        });

    };

    mapAsync = function (arr, f, config) {
        // TODO Inefficient?
        return reduceAsync(arr, function (acc, x, i, xs) {
            acc.push(f(x, i, xs));
            return acc;
        }, [], config);
    };


    // parseQuery
    // Parses URL queries to objects

    parseQuery = function (qstr) {
        var query = {};
        var a = qstr.substr(1).split('&');
        for (var i = 0; i < a.length; i++) {
            var b = a[i].split('=');
            query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
        }
        return query;
    }

    // debounce_old
    // For, e.g., preventing excessive resize() calls

    debounce_old = function (func, timeout) {
        var timeoutID, timeout = timeout || 200;
        return function () {
            var scope = this,
                args = arguments;
            clearTimeout(timeoutID);
            timeoutID = setTimeout(function () {
                func.apply(scope, Array.prototype.slice.call(args));
            }, timeout);
        }
    }

    // debounce
    // taken from underscore( _.debounce )
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.

    debounce = function (func, wait, immediate) {
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
};

export default cronelib;