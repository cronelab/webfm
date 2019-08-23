import $ from 'jquery'
var bci2k = require('bci2k');
require('setimmediate'); // Needed to fix promise
var Promise = require('promise-polyfill'); // Needed for IE Promise


function promisify(f) {
    return new Promise(function (resolve, reject) {
        f(function (err, result) {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

class bciwatch {
    constructor() {

        var watcher = this;
        this.onstatechange = function (newState) {};
        this._bciConnection = new bci2k.Connection();
        this.watching = false;
        this.state = 'Not Connected';
        this.config = {};
    }

    connect(address) {
        var watcher = this;

        if (address === undefined) {
            address = this.config.sourceAddress;
        }

        return this._bciConnection.connect(address)
            .then(function (event) {
                watcher._updateState('Connected');
                return event;
            });

    }

    loadConfig(configURI) {

        var watcher = this; // Cache this for nested functions
        return new Promise(function (resolve, reject) {
            $.getJSON(configURI)
                .done(resolve)
                .fail(function (req, reason, err) {
                    // TODO Get error message from jquery object
                    reject('Could not load watcher config from ' + configURI + ' : ' + reason);
                });
        }).then(function (data) {
            watcher.config = data;
        });

    }
    _updateState(newState) {
        if (this.state != newState) {
            this.state = newState;
            this.onstatechange(this.state);
        }
    }

    _checkState() {

        var watcher = this;

        var tryLaterIfWatching = function () {
            if (watcher.watching) {
                setTimeout(function () {
                    watcher._checkState();
                }, watcher.config.checkStateInterval);
            }
        };

        if (!this._bciConnection.connected()) {
            if (this.config.debug) {
                console.log('Could not check whether BCI2K is running: Not connected to BCI2K.');
            }
            this._updateState('Not Connected');
            tryLaterIfWatching();
            return;
        }

        this._bciConnection.execute('Get System State', function (result) {
            var newState = result.output.trim();
            if (watcher.config.debug) {
                console.log('System state: ' + newState);
            }
            watcher._updateState(newState);
            tryLaterIfWatching();
        });

    }

    start() {
        var watcher = this;

        this.watching = true;

        setTimeout(function () {
            watcher._checkState();
        }, 0);
    }


    getParameter(parameter) {
        var watcher = this;
        return promisify(function (cb) {
            watcher._bciConnection.execute('Get Parameter ' + parameter, function (result) {
                // TODO Do I want this for everything?
                // TODO Check for err based on result.exitcode
                cb(null, result.output.trim());
            });
        });
    }
}



export default bciwatch;