import cronelib from '../lib/cronelib';
var fmstat = require('../map/fmstat');


class fmdata {
    constructor() {

        this.metadata = {};
        this.contents = {};
        this.displayData = {};
        this._channelStats = {};
        this._clean = true;
        this.cronelib = new cronelib();
    }

    _initialize(data) {
        var dataset = this;
        return this._validate(data)
            .then(function (validatedData) {
                dataset.metadata = validatedData.metadata;
                dataset.contents = validatedData.contents;
                dataset._setupChannelStats();
            })
            .then(function () {
                return dataset._updateDisplayData()
                    .then(() => console.log('Finished display update'));
            });
    }
    _validate(data) {

        return new Promise(function (resolve, reject) {

            // Convenience
            var metadata = data.metadata;
            var contents = data.contents;

            // Make new copies for returning
            // TODO These aren't deep copies; should they be?
            var newMetadata = Object.assign({}, metadata);
            var newContents = Object.assign({}, contents);


            // == metadata

            // Guards

            // If metadata has an '_import' attribute, something went wrong
            // with the formation, so we reject
            if (metadata['_import'] != undefined) {
                reject('Loaded dataset has an "_import" metadata field, and hence is not complete.');
                return;
            }

            // Same deal with '_export'
            if (metadata['_export'] != undefined) {
                reject('Loaded dataset has an "_export" metadata field, and hence is not complete.');
                return;
            }

            // montage

            var montageFromKeys = function (keys) {
                // TODO Provide a smart ordering from a (possibly unordered)
                // key list

                return keys;
            };

            if (metadata.montage === undefined) {

                if (metadata.sensorGeometry !== undefined) {

                    // Use the sensorGeometry
                    var geometryKeys = Object.keys(metadata.sensorGeometry);
                    newMetadata.montage = montageFromKeys(geometryKeys);

                } else {
                    // Need to resort to the contents

                    if (contents.values !== undefined) {

                        // Use the values
                        var valuesKeys = Object.keys(contents.values);
                        newMetadata.montage = montageFromKeys(valuesKeys);

                    } else {
                        if (contents.stats !== undefined) {
                            if (contents.stats.estimators !== undefined) {
                                var estimatorKeys = Object.keys(content.stats.estimators);
                                var firstEstimatorKeys = Object.keys(content.stats.estimators[estimatorKeys[0]]);
                                newMetadata.montage = montageFromKeys(firstEstimatorKeys);
                            } else {
                                reject('Loaded dataset has no information about recording channels.');
                                return;
                            }
                        } else {
                            reject('Loaded dataset has no information about recording channels.');
                            return;
                        }
                    }
                }
            }
            if (metadata.labels === undefined) {
                // TODO Can we infer anything?
                newMetadata.labels = [];
            }
            if (contents.values === undefined && contents.stats === undefined && contents.trials === undefined) {
                reject('Loaded dataset lacks content.');
                return;
            }
            resolve({
                'metadata': newMetadata,
                'contents': newContents
            });
        });
    }

    _setupChannelStats() {

        // Capture this
        var dataset = this;

        if (this.contents.values !== undefined) {
            // values exists, so we pay no attention to stats
            this._channelStats = undefined;
            return;
        }

        if (this.contents.stats !== undefined) {
            // We've got stats without, so let's use them to make our structures

            var stats = this.contents.stats; // convenience

            // Check which distribution we have
            // TODO For now we only support Gaussian :(
            // TODO Error checking

            if (stats.distribution.toLowerCase() == 'gaussian') {

                var channels = Object.keys(stats.estimators.mean);

                channels.forEach(function (ch) {

                    // Convenience
                    var mean = stats.estimators.mean[ch];
                    var variance = stats.estimators.variance[ch];
                    var count = stats.estimators.count[ch];

                    // Wrap the estimators for each time point into

                    if (dataset.isTimeseries()) {

                        // TODO Error checking
                        var baselineMean = stats.baseline.mean[ch];
                        var baselineVariance = stats.baseline.variance[ch];
                        var baselineCount = stats.baseline.count[ch];

                        var statValues = mean.map(function (d, i) {
                            return new fmstat.Gaussian(mean[i], variance[i], count[i]);
                        });

                        dataset._channelStats[ch] = new fmstat.ChannelStat({
                            baseline: new fmstat.Gaussian(baselineMean, baselineVariance, baselineCount),
                            values: statValues
                        });

                    } else {

                        // TODO ChannelStat overkill for single datum?
                        dataset._channelStats[ch] = new fmstat.ChannelStat({
                            values: [new fmstat.Gaussian(mean, variance, count)]
                        });

                    }

                });

            } else {
                // Unsupported distribution
                this._channelStats = undefined;
            }

            return;

        }

        if (this.contents.trials !== undefined) {
            // We've got trials, so populate our stats with them
            // TODO Assumes Gaussian, cause I'm dumb for the time being

            // Convenience
            var trials = this.contents.trials;

            // TODO Error checking
            var channels = Object.keys(trials[0]);

            // Global setup
            var newChannelOpts = {};

            if (dataset.isTimeseries()) {
                newChannelOpts.baselineWindow = this._windowInSamples(dataset.metadata.baselineWindow);
            }

            channels.forEach(function (ch) {

                var newChannel = new fmstat.ChannelStat(newChannelOpts);

                trials.forEach(function (trialData) {
                    newChannel.ingest(trialData[ch]);
                });

                dataset._channelStats[ch] = new fmstat.ChannelStat();

            });

            return;

        }

        // Can't do anything for stats ¯\_(ツ)_/¯
        this._channelStats = undefined;

    }

    _windowInSamples(windowInSeconds) {

        // Guards

        if (!this.isTimeseries()) {
            return undefined;
        }
        if (this.contents === undefined) {
            return undefined;
        }
        if (!Array.isArray(this.contents.times)) {
            return undefined;
        }

        var totalSamples = this.contents.times.length;
        var dataWindow = {
            start: this.contents.times[0],
            end: this.contents.times[this.contents.times.length - 1]
        };
        var totalTime = dataWindow.end - dataWindow.start;

        var windowFloat = {
            start: ((windowInSeconds.start - dataWindow.start) / totalTime) * totalSamples,
            end: ((windowInSeconds.end - dataWindow.start) / totalTime) * totalSamples
        }

        // TODO Should it be conservative like this, or more liberal?
        return {
            start: Math.ceil(windowFloat.start),
            end: Math.floor(windowFloat.end)
        };

    }

    _updateDisplayData() {

        var dataset = this;

        if (this.contents.values !== undefined) {

            // We have values, so just use them for display
            this.displayData = this.contents.values;
            return Promise.resolve();

        }

        if (this.contents.stats !== undefined) {

            // TODO Make configurable
            return this.cronelib.forEachAsync(Object.keys(this._channelStats), function (ch) {
                dataset.displayData[ch] = dataset._channelStats[ch].fdrCorrectedValues(0.05);
            }, {
                batchSize: 5
            });

        }

    }

    _updateContentsStats() {

        var dataset = this;

        // TODO This notation may not be strict enough ...
        this.contents.stats = this.contents.stats || {};
        // TODO ... may require this
        // if ( this.contents.stats === undefined ) {
        //     this.contents.stats = {};
        // }

        // TODO Hard-coded to be Gaussian at present
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

    get(data) {

        var dataset = this;
        dataset._clean = true;
        return dataset._initialize(data);


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

            $.ajax({
                    url: url,
                    method: 'PUT',
                    data: JSON.stringify(dataToSend)
                })
                .done(function (data) {
                    dataset._clean = true; // We just put, so everything is clean
                    resolve(data);
                })
                .fail(function (req, reason, err) {
                    reject('Error putting WebFM file to ' + url + ': ' + reason);
                });

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

            dataset._channelStats[ch] = new fmstat.ChannelStat({
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

        if (!this.isTimeseries()) {
            // Slicing by time is undefined for non-timeseries data
            return undefined;
        }

        var dataset = this;

        // TODO Bit of a kludge to get length of first element of an object
        var dataSamples = 0;
        Object.keys(this.displayData).every(function (ch) {
            dataSamples = dataset.displayData[ch].length;
            return false; // Makes it so we only execute once
        });

        var dataWindow = {
            start: this.contents.times[0],
            end: this.contents.times[this.contents.times.length - 1]
        };
        var totalTime = dataWindow.end - dataWindow.start;

        var timeIndexFloat = ((time - dataWindow.start) / totalTime) * dataSamples;
        var timeIndex = Math.floor(timeIndexFloat);
        var timeFrac = timeIndexFloat - timeIndex;

        return Object.keys(this.displayData).reduce(function (obj, ch) {
            obj[ch] = (1.0 - timeFrac) * dataset.displayData[ch][timeIndex] + (timeFrac) * dataset.displayData[ch][timeIndex + 1];
            return obj
        }, {});

    }

    updateMetadata(newMetadata) {

        // Merge the new metadata over the top of what we currently have
        Object.assign(this.metadata, newMetadata);

    }

    updateBaselineWindow(newWindow) {

        // Change our metadata to reflect the new window
        this.metadata.baselineWindow = newWindow;

        // Update our ChannelStats objects' internals
        var newWindowSamples = this._windowInSamples(newWindow);
        if (newWindowSamples === undefined) {
            return Promise.resolve();
        }

        return this.cronelib.forEachAsync(Object.keys(this._channelStats), function (ch) {
            this._channelStats[ch].recompute(newWindowSamples);
        }, {
            batchSize: 5
        });

    }

    ingest(trialData) {

        var dataset = this;

        return this.cronelib.forEachAsync(Object.keys(this._channelStats), function (ch) {
                dataset._channelStats[ch].ingest(trialData[ch]);
            }, {
                batchSize: 5
            }).then(function () {

                // Update the stats structure in contents
                dataset._updateContentsStats();

                // Update the trials structure " "
                if (dataset.contents.trials === undefined) {
                    dataset.contents.trials = [];
                }
                dataset.contents.trials.push(trialData);

                // We're dirty. So dirty.
                dataset._clean = false;

            })
            .then(function () {
                return dataset._updateDisplayData();
            });

    }

};

export default fmdata;