import {
    Gaussian,
    ChannelStat
} from '../map/fmstat';

class fmdata {
    constructor() {

        this.metadata = {};
        this.contents = {};
        this.displayData = {};
        this._channelStats = {};
        this._clean = true;
    }

    _validate(data) {
        return new Promise((resolve, reject) => {

            if (data.contents.values === undefined && data.contents.stats === undefined && data.contents.trials === undefined) {
                reject('Loaded dataset lacks content.');
                return;
            }
            resolve({
                'metadata': Object.assign({}, data.metadata),
                'contents': Object.assign({}, data.contents)
            });
        });
    }

    _setupChannelStats() {
        var dataset = this;
        if (this.contents.values !== undefined) {
            this._channelStats = undefined;
            return;
        }
        if (this.contents.stats !== undefined) {
            var stats = this.contents.stats; // convenience
            var channels = Object.keys(stats.estimators.mean);
            channels.forEach(ch => {
                var mean = stats.estimators.mean[ch];
                var variance = stats.estimators.variance[ch];
                var count = stats.estimators.count[ch];
                if (dataset.isTimeseries()) {
                    var baselineMean = stats.baseline.mean[ch];
                    var baselineVariance = stats.baseline.variance[ch];
                    var baselineCount = stats.baseline.count[ch];
                    var statValues = mean.map((d, i) => new Gaussian(mean[i], variance[i], count[i]));
                    dataset._channelStats[ch] = new ChannelStat({
                        baseline: new Gaussian(baselineMean, baselineVariance, baselineCount),
                        values: statValues
                    });
                } else {
                    dataset._channelStats[ch] = new ChannelStat({
                        values: [new Gaussian(mean, variance, count)]
                    });
                }
            });

            return;
        }
        if (this.contents.trials !== undefined) {
            var trials = this.contents.trials;
            var channels = Object.keys(trials[0]);
            var newChannelOpts = {};
            if (dataset.isTimeseries()) {
                newChannelOpts.baselineWindow = this._windowInSamples(dataset.metadata.baselineWindow);
            }
            channels.forEach(function (ch) {
                var newChannel = new ChannelStat(newChannelOpts);
                trials.forEach(function (trialData) {
                    newChannel.ingest(trialData[ch]);
                });
                dataset._channelStats[ch] = new ChannelStat();
            });
            return;
        }
        this._channelStats = undefined;
    }

    _windowInSamples(windowInSeconds) {
        if (!this.isTimeseries()) return undefined;
        if (this.contents === undefined) return undefined;
        if (!Array.isArray(this.contents.times)) return undefined;
        let dataStart = this.contents.times[0]
        let dataEnd = this.contents.times[this.contents.times.length - 1]
        let windowStart = ((windowInSeconds.start - dataStart) / dataEnd - dataStart) * this.contents.times.length
        let windowEnd = ((windowInSeconds.end - dataStart) / dataEnd - dataStart) * this.contents.times.length
        return {
            start: Math.ceil(windowStart),
            end: Math.floor(windowEnd)
        };
    }


    _updateDisplayData() {
        var dataset = this;
        if (this.contents.values !== undefined) {
            this.displayData = this.contents.values;
            return Promise.resolve();
        }

        if (this.contents.stats !== undefined) {
            return Object.keys(this._channelStats).forEach(ch => {
                dataset.displayData[ch] = dataset._channelStats[ch].fdrCorrectedValues(0.05);
            })
        }
    }


    ingest(trialData) {
        return new Promise((resolve, reject) => {
            var dataset = this;

            Object.keys(this._channelStats).forEach(ch => dataset._channelStats[ch].ingest(trialData[ch]))

            dataset._updateContentsStats();
            if (dataset.contents.trials === undefined) {
                dataset.contents.trials = [];
            }
            dataset.contents.trials.push(trialData);
            dataset._clean = false;
            dataset._updateDisplayData()
            resolve()
        })


    }

    _updateContentsStats() {
        var dataset = this;
        this.contents.stats = this.contents.stats || {};
        this.contents.stats.distribution = 'gaussian';
        this.contents.stats.baseline = this.contents.stats.baseline || {};
        this.contents.stats.baseline.mean = this.contents.stats.baseline.mean || {};
        this.contents.stats.baseline.variance = this.contents.stats.baseline.variance || {};
        this.contents.stats.baseline.count = this.contents.stats.baseline.count || {};

        this.contents.stats.estimators = this.contents.stats.estimators || {};
        this.contents.stats.estimators.mean = this.contents.stats.estimators.mean || {};
        this.contents.stats.estimators.variance = this.contents.stats.estimators.variance || {};
        this.contents.stats.estimators.count = this.contents.stats.estimators.count || {};

        Object.keys(this._channelStats).forEach(function (ch) {

            dataset.contents.stats.baseline.mean[ch] = dataset._channelStats[ch].baseline.mean;
            dataset.contents.stats.baseline.variance[ch] = dataset._channelStats[ch].baseline.variance;
            dataset.contents.stats.baseline.count[ch] = dataset._channelStats[ch].baseline.count;

            var values = dataset._channelStats[ch].values;

            if (!values) {
                dataset.contents.stats.estimators.mean[ch] = undefined;
                dataset.contents.stats.estimators.variance[ch] = undefined;
                dataset.contents.stats.estimators.count[ch] = undefined;
                return;
            }
            var extractor = function (estimator) {
                return function (v) {
                    return v[estimator];
                };
            };

            if (!Array.isArray(values)) {
                dataset.contents.stats.estimators.mean[ch] = extractor('mean')(values);
                dataset.contents.stats.estimators.variance[ch] = extractor('variance')(values);
                dataset.contents.stats.estimators.count[ch] = extractor('count')(values);
                return;
            }
            dataset.contents.stats.estimators.mean[ch] = values.map(extractor('mean'));
            dataset.contents.stats.estimators.variance[ch] = values.map(extractor('variance'));
            dataset.contents.stats.estimators.count[ch] = values.map(extractor('count'));
        });
    }

    //This is only for Record
    get(data) {
        var dataset = this;
        dataset._clean = true;

        return this._validate(data)
            .then(validatedData => {
                dataset.metadata = validatedData.metadata;
                dataset.contents = validatedData.contents;
                dataset._setupChannelStats();
            })
            .then(() => dataset._updateDisplayData());



    }

    put(url, opts) {
        var options = {
            import: false
        };
        if (opts) {
            Object.assign(options, opts);
        }

        var dataset = this;

        return new Promise(function (resolve, reject) {

            // Deep copy
            var dataToSend = JSON.parse(JSON.stringify({
                metadata: dataset.metadata,
                contents: dataset.contents
            }));

            if (options.import) {
                dataToSend.metadata['_import'] = options.import;
            }

            // TODO Doing two stringifys to support re-writing of _import
            // Better way?
            fetch(url, {
                method: 'PUT',
                body: JSON.stringify(dataToSend)
            }).then(data => {
                dataset._clean = true; // We just put, so everything is clean
                resolve(data);
            })
        });

    }

    setupChannels(channels) {
        var dataset = this;
        this.metadata.montage = channels;
        if (this._channelStats === undefined) {
            this._channelStats = {};
        }
        channels.forEach(function (ch) {
            var newBaselineWindow = undefined;
            if (dataset.metadata) {
                newBaselineWindow = dataset.metadata.baselineWindow;
            }

            dataset._channelStats[ch] = new ChannelStat({
                baselineWindow: dataset._windowInSamples(newBaselineWindow)
            });

        });

        this._clean = false;

    }

    isTimeseries() {

        // If we're marked as being a timeseries, we're a timeseries
        if (this.metadata.labels.indexOf('timeseries') >= 0) {
            return true;
        }

        var someMember = function (obj) {
            var ret = null;
            Object.keys(obj).every(function (k) {
                ret = obj[k];
                return false;
            });
            return ret;
        }

        // If we have values, and an individual value entry is an array, we're a timeseries
        if (this.contents.values !== undefined) {
            if (Array.isArray(someMember(this.contents.values))) {
                return true;
            }
        }

        // Similar condition, but for stats.estimators
        if (this.contents.stats !== undefined) {
            if (this.contents.stats.estimators !== undefined) {
                var someEstimator = someMember(this.contents.estimators);
                if (Array.isArray(someMember(someEstimator))) {
                    return true;
                }
            }
        }

        // TODO Trials?

        return false;

    }

    isClean() {
        return this._clean;
    }

    getTimeBounds() {

        if (!this.isTimeseries()) {
            return undefined;
        }

        if (!this.contents.times) {
            return undefined;
        }

        return {
            start: this.contents.times[0],
            end: this.contents.times[this.contents.times.length - 1]
        };

    }

    updateTimes(times) {
        this.contents.times = times;
    }

    updateTimesFromWindow(timeWindow, nTimes) {

        var newTimes = [];
        for (var i = 0; i < nTimes; i++) {
            newTimes.push(timeWindow.start + (i / (nTimes - 1)) * (timeWindow.end - timeWindow.start));
        }

        this.updateTimes(newTimes);

    }

    getTrialCount() {

        if (this.contents.trials !== undefined) {
            // We have trials, so count them
            return this.contents.trials.length;
        }

        if (this.contents.stats !== undefined) {
            // Attempt to extract trial count from the stats

            if (this.contents.stats.distribution.toLowerCase() == "gaussian") {
                // Gaussians have a "count" parameter, so take the minimum
                // of the available values
                // TODO Reasonable?

                var counts = this.contents.stats.estimators.count;

                var allCounts = Object.keys(counts).reduce(function (acc, ch) {
                    return acc.concat(counts[ch]);
                }, []);

                return allCounts.reduce(function (a, b) {
                    return Math.min(a, b);
                });
            }

        }

        // No other way to get trial count
        return undefined;

    }

    dataForTime(time) {
        if (!this.isTimeseries()) return undefined;
        var dataset = this;
        var dataSamples = 0;
        Object.keys(this.displayData).every(function (ch) {
            dataSamples = dataset.displayData[ch].length;
            return false;
        });

        var dataWindow = {
            start: this.contents.times[0],
            end: this.contents.times[this.contents.times.length - 1]
        };
        var timeIndexFloat = ((time - dataWindow.start) / (dataWindow.end - dataWindow.start)) * dataSamples;
        var timeIndex = Math.floor(timeIndexFloat);
        var timeFrac = timeIndexFloat - timeIndex;

        let disp = Object.keys(dataset.displayData).reduce(function (obj, ch) {
            let ins = dataset.displayData[ch]
            obj[ch] = (1.0 - timeFrac) * ins[timeIndex] + (timeFrac) * ins[timeIndex + 1];
            return obj
        }, {});

        return disp

    }


    updateBaselineWindow(newWindow) {
        this.metadata.baselineWindow = newWindow;
        var newWindowSamples = this._windowInSamples(newWindow);
        if (newWindowSamples === undefined) return Promise.resolve();
        return Object.keys(this._channelStats).forEach(ch => this._channelStats[ch].recompute(newWindowSamples))
    }
};

export default fmdata;