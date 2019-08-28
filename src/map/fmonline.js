import BCI2K from "@cronelab/bci2k";


class OnlineDataSource {
    constructor() {
        var manager = this;
        this.onproperties = properties => {};
        this.onBufferCreated = () => {};
        this.onRawSignal = rawSignal => {};
        this.onFeatureSignal = featureSignal => {};
        this.onStartTrial = () => {};
        this.ontrial = trialData => {};
        this.onSystemStateChange = newState => {};
        this._bciConnection = new BCI2K.bciOperator();
        this._bciSourceConnection = new BCI2K.bciData();
        this._bciFilterConnection = new BCI2K.bciData();

        this.dataFormatter = new DataFormatter();
        this.dataFormatter.onBufferCreated = () => manager.onBufferCreated()
        this.dataFormatter.onSourceSignal = rawSignal => manager.onRawSignal(rawSignal);
        this.dataFormatter.onFeatureSignal = featureSignal => manager.onFeatureSignal(featureSignal);
        this.dataFormatter.ontrial = trialData => manager.ontrial(trialData);
        this.dataFormatter.onStartTrial = () => manager.onStartTrial();
        this.dataFormatter.onFeatureProperties = properties => manager.onproperties(properties);
        this.config = {};
    }
    connect(address) {
        var manager = this; // Capture this for nested functions
        return this._bciConnection.connect(address)
            .then(event => {
                this._bciConnection.stateListen()
                this._bciConnection.onStateChange = currentState => {
                    if (currentState == "Running") {
                        console.log("Do ittt")
                        manager._connectToData();

                    } else {
                        console.log("STOP!")
                    }
                }

            });
    }


    _connectToData() {
        var manager = this;
        this._bciSourceConnection.connect("ws://127.0.0.1:20100").then(dataConnection => {
            manager.dataFormatter._connectSource(this._bciSourceConnection)
        })
        this._bciFilterConnection.connect("ws://127.0.0.1:20203").then(dataConnection => {
            manager.dataFormatter._connectFeature(this._bciFilterConnection)

        })
    }
}

class DataFormatter {
    constructor() {
        this._sourceConnection = null;
        this._featureConnection = null;
        this._stateTiming = true;
        this._timingChannel = 'ainp1';
        this._timingState = 'StimulusCode';
        this.threshold = {
            offValue: 0.0,
            onValue: 1.0
        };
        this.featureBand = {
            low: 70.0,
            high: 110.0
        };
        this.trialWindow = {
            start: -1.0,
            end: 3.0
        };
        this._bufferPadding = 0.5;
        this._bufferWindow = {
            start: this.trialWindow.start - this._bufferPadding,
            end: this.trialWindow.end + this._bufferPadding
        };
        this._featureKernel = null;
        this._frameBlocks = null;
        this._trialBlocks = null;
        this._postTrialBlocks = null;
        this.canProcess = false;
        this.sourceChannels = null;
        this.sourceProperties = null;
        this.sourceBuffer = null;
        this.sourceBufferChannels = null;
        this.sourceBlockNumber = 0;
        this.featureChannels = null;
        this.featureProperties = null;
        this.featureBuffer = null;
        this.featureBlockNumber = 0;
        this.previousState = null;
        this.stateBlockNumber = 0;
        this.trialEndBlockNumber = null;
        this.onBufferCreated = () => {};
        this.onSourceSignal = rawData => {};
        this.onFeatureSignal = featureData => {};
        this.onStartTrial = () => {};
        this.ontrial = trialData => {};
        this.onSourceProperties = properties => {};
        this.onFeatureProperties = properties => {};
    }
    updateTrialWindow(newWindow) {
        if (!newWindow) {
            return;
        }
        if (newWindow.start !== undefined) {
            this.trialWindow.start = newWindow.start;
            this._bufferWindow.start = newWindow.start - this._bufferPadding;
        }
        if (newWindow.end !== undefined) {
            this.trialWindow.end = newWindow.end;
            this._bufferWindow.end = newWindow.end + this._bufferPadding;
        }
        this.trialEndBlockNumber = null; // Reset trial
        if (this.canProcess) {
            this._setupBuffers(); // Make new buffers
        }
    }

    updateFeatureBand(newBand) {
        if (!newBand) {
            return;
        }
        if (newBand.low !== undefined) {
            this.featureBand.low = newBand.low;
        }
        if (newBand.high !== undefined) {
            this.featureBand.high = newBand.high;
        }
        this._setupFeatureKernel();
    }

    updateThreshold(newThreshold) {
        if (!newThreshold) {
            return;
        }
        if (newThreshold.offValue !== undefined) {
            this.threshold.offValue = newThreshold.offValue;
        }
        if (newThreshold.onValue !== undefined) {
            this.threshold.onValue = newThreshold.onValue;
        }
    }
    updateTimingMode(newMode) {
        if (newMode == 'state') {
            this._stateTiming = true;
        } else {
            this._stateTiming = false;
        }
    }
    updateTimingChannel(newChannel) {
        if (!newChannel) {
            return;
        }
        this._timingChannel = newChannel;
    }
    _connectSource(dataConnection) {
        var formatter = this; // Capture this
        this._sourceConnection = dataConnection;
        this._sourceConnection.onSignalProperties = function (properties) {
            formatter.sourceProperties = properties;
            formatter.sourceChannels = properties.channels;
            if (!formatter._stateTiming) {
                if (formatter.sourceChannels.indexOf(formatter._timingChannel) < 0) {
                    console.log('Timing channel not detected; falling back to imprecise timing.');
                    formatter._stateTiming = true;
                    formatter.sourceBufferChannels = [];
                } else {
                    formatter.sourceBufferChannels = [formatter._timingChannel];
                }
            }
            formatter.onSourceProperties(properties);
            formatter._propertiesReceived();
        };
        this._sourceConnection.onGenericSignal = function (genericSignal) {
            formatter._processSourceSignal(genericSignal);
        };
        this._sourceConnection.onStateFormat = function (format) {
            if (format[formatter._timingState] === undefined) {
                console.log('WARNING: Desired timing state ' + formatter._timingState + ' was not detected in the state format for Source.');
            }
        };
    }
    _connectFeature(dataConnection) {
        var formatter = this; // Capture this
        this._featureConnection = dataConnection;
        this._featureConnection.onSignalProperties = function (properties) {
            formatter.featureProperties = properties;
            formatter.featureChannels = properties.channels;
            formatter.onFeatureProperties(properties);
            formatter._propertiesReceived();
        };
        this._featureConnection.onGenericSignal = function (genericSignal) {
            formatter._processFeatureSignal(genericSignal);
        };
        this._featureConnection.onStateVector = function (stateVector) {
            formatter._processStateVector(stateVector);
        };
    }
    _propertiesReceived() {
        if (this.sourceProperties && this.featureProperties) {
            this._allPropertiesReceived();
        }
    }
    _allPropertiesReceived() {
        this._setupFeatureKernel();
        this._setupBuffers();
    }
    _setupBuffers() {
        var blockLengthSeconds = this.sourceProperties.numelements * this.sourceProperties.elementunit.gain;
        var windowLengthSeconds = this._bufferWindow.end - this._bufferWindow.start;
        var windowLengthBlocks = Math.ceil(windowLengthSeconds / blockLengthSeconds);
        this.featureBuffer = this.featureChannels.reduce(function (arr, ch, i) {
            arr.push(Array.apply(null, new Array(windowLengthBlocks)).map(Number.prototype.valueOf, 0));
            return arr;
        }, []);
        var trialLengthSeconds = this.trialWindow.end - this.trialWindow.start;
        this._trialBlocks = Math.ceil(trialLengthSeconds / blockLengthSeconds);
        this._postTrialBlocks = Math.ceil(this.trialWindow.end / blockLengthSeconds);
        console.log('Created feature buffer: ' + this.featureChannels.length + ' channels x ' + windowLengthBlocks + ' samples.');
        this.canProcess = true;
        this.onBufferCreated();
    }
    _kernelForFrequencies(fv) {
        var formatter = this;
        var isInBand = function (x) {
            return (formatter.featureBand.low <= x && x <= formatter.featureBand.high)
        };
        var windowRaw = fv.map(function (f) {
            return isInBand(f) ? 1.0 : 0.0;
        });
        var windowSum = windowRaw.reduce(function (a, b) {
            return a + b;
        });
        return windowRaw.map(function (w) {
            return w / windowSum;
        });
    }

    _dumbKernel(fv) {
        return fv.map(function (f) {
            return 1.0 / fv.length;
        });
    }

    _setupFeatureKernel() {
        var formatter = this; // Capture this
        var transform = this.featureProperties.elementunit;
        var featureFreqs = this.featureProperties.elements.map(function (e) {
            return transform.offset + (e * transform.gain);
        });
        this._featureKernel = this._dumbKernel(featureFreqs);
    }
    _computeFeature(data) {
        if (!this._featureKernel) {
            return data.map(function (dv) {
                return 0.0; // TODO Should be undefined, and caller should deal
            });
        }
        var formatter = this; // Capture this
        return data.map(function (dv) {
            return dv.reduce(function (acc, el, iel) {
                return acc + el * formatter._featureKernel[iel];
            }, 0.0);
        });
    }
    _pushFeatureSample(sample) {
        var formatter = this; // Capture this
        this.featureBuffer.forEach(function (fv) {
            fv.shift();
        });
        sample.forEach(function (d, i) {
            formatter.featureBuffer[i].push(d);
        });
    }

    _processSourceSignal(signal) {
        var formatter = this; // Capture this
        if (!this.canProcess) {
            console.log("Received source signal, but can't process it.");
            return;
        }
        this.sourceBlockNumber += 1;
        if (!this._stateTiming) {
            var timingIndex = this.sourceChannels.indexOf(this._timingChannel);
            signal[timingIndex].some(function (s) {
                return formatter._updateTimingSignal(s);
            });
        }
        this.onSourceSignal(this._formatSourceData(signal));
    }

    _processFeatureSignal(signal) {
        if (!this.canProcess) {
            console.log("Received feature signal, but can't process it.");
            return;
        }
        this.featureBlockNumber += 1;
        var computedFeatures = this._computeFeature(signal);
        this._pushFeatureSample(computedFeatures);
        if (this.trialEndBlockNumber) {
            if (this.featureBlockNumber >= this.trialEndBlockNumber) {
                this._sendTrial();
            }
        }
        this.onFeatureSignal(this._formatFeatureData(computedFeatures));
    }

    _processStateVector(state) {
        var formatter = this; // Capture this
        if (!this.canProcess) {
            console.log("Received a state signal, but can't process it.");
        }
        this.stateBlockNumber += 1;
        if (this._stateTiming) {
            state[this._timingState].some(function (s) {
                return formatter._updateTimingState(s);
            });
        }
    }

    _signalThresholdState(signalValue) {
        if (this.threshold.offValue < this.threshold.onValue) {
            return (signalValue >= this.threshold.onValue) ? 1 : 0;
        }
        return (signalValue <= this.threshold.onValue) ? 1 : 0;
    }

    _updateTimingSignal(newValue) {
        var newState = this._signalThresholdState(newValue);
        return this._updateTimingState(newState);
    }
    _updateTimingState(newState) {
        if (newState == this.previousState) {
            return false;
        }
        this.previousState = newState;
        this._timingStateChanged(newState);
        return true;
    }

    _timingStateChanged(newState) {
        if (newState == 0) {
            return;
        }
        if (this.trialEndBlockNumber) {
            console.log('WARNING Received new trial state, but already in a trial. Ignoring.');
            return;
        }
        this.trialEndBlockNumber = (this.stateBlockNumber - 1) + this._postTrialBlocks;
        this.onStartTrial();
    }

    _sendTrial() {
        var formatter = this;
        var deltaBlocks = this.featureBlockNumber - this.trialEndBlockNumber;
        var trialData = this.featureBuffer.map(function (dv) {
            return dv.slice(dv.length - deltaBlocks - formatter._trialBlocks, dv.length - deltaBlocks);
        });
        this.trialEndBlockNumber = null;
        this.ontrial(this._formatFeatureData(trialData));
    }

    _formatFeatureData(trialData) {
        return this.featureChannels.reduce(function (obj, ch, i) {
            obj[ch] = trialData[i];
            return obj;
        }, {});
    }

    _formatSourceData(sourceData) {
        return this.sourceChannels.reduce(function (obj, ch, i) {
            obj[ch] = sourceData[i];
            return obj;
        }, {});
    }
}



module.exports = {
    OnlineDataSource,
    DataFormatter
};