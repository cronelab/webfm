import BCI2K from "@cronelab/bci2k";

class OnlineDataSource {
    constructor() {
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
        this._stateTiming = true;
        this._timingChannel = 'ainp1';
        this._timingState = 'StimulusCode';
        this.threshold = {
            offValue: 0.0,
            onValue: 1.0
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

    }
    connect(address) {
        var manager = this;
        return this._bciConnection.connect(address)
            .then(event => {
                this._bciConnection.stateListen()
                this._bciConnection.onStateChange = currentState => {
                    if (currentState == "Running") manager._connectToData();
                }
            });
    }
    _allPropertiesReceived() {
        let featureFreqs = this.featureProperties.elements.map(e => {
            this.featureProperties.elementunit.offset + (e * this.featureProperties.elementunit.gain)
        });
        console.log(featureFreqs)
        this._featureKernel = featureFreqs.map(f => 1.0 / featureFreqs.length);
        this._setupBuffers();
    }

    _setupBuffers() {
        let blockLengthSeconds = this.sourceProperties.numelements * this.sourceProperties.elementunit.gain;
        let windowLengthSeconds = this._bufferWindow.end - this._bufferWindow.start;
        let windowLengthBlocks = Math.ceil(windowLengthSeconds / blockLengthSeconds);
        this.featureBuffer = this.featureChannels.reduce(function (arr, ch, i) {
            arr.push(Array.apply(null, new Array(windowLengthBlocks)).map(Number.prototype.valueOf, 0));
            return arr;
        }, []);
        this._trialBlocks = Math.ceil((this.trialWindow.end - this.trialWindow.start) / blockLengthSeconds);
        this._postTrialBlocks = Math.ceil(this.trialWindow.end / blockLengthSeconds);
        console.log('Created feature buffer: ' + this.featureChannels.length + ' channels x ' + windowLengthBlocks + ' samples.');
        this.canProcess = true;
        this.onBufferCreated();
    }

    updateTrialWindow(newWindow) {
        if (!newWindow) return;
        if (newWindow.start !== undefined) {
            this.trialWindow.start = newWindow.start;
            this._bufferWindow.start = newWindow.start - this._bufferPadding;
        }
        if (newWindow.end !== undefined) {
            this.trialWindow.end = newWindow.end;
            this._bufferWindow.end = newWindow.end + this._bufferPadding;
        }
        this.trialEndBlockNumber = null;
        if (this.canProcess) this._setupBuffers();
    }

    _processFeatureSignal(signal) {
        if (!this.canProcess) {
            console.log("Received feature signal, but can't process it.");
            return;
        }
        this.featureBlockNumber += 1;

        let computedFeatures = (!this._featureKernel) ? signal.map(dv => 0.0) : signal.map(dv => {
            return dv.reduce((acc, el, iel) => {
                return acc + el * this._featureKernel[iel];
            }, 0.0);
        });

        this.featureBuffer.forEach(fv => fv.shift());
        computedFeatures.forEach((d, i) => this.featureBuffer[i].push(d));
        if (this.trialEndBlockNumber)
            if (this.featureBlockNumber >= this.trialEndBlockNumber) this._sendTrial();
        this.onFeatureSignal(this._formatData("Feature", computedFeatures));
    }
    _processStateVector(state) {
        if (!this.canProcess) console.log("Received a state signal, but can't process it.");
        this.stateBlockNumber += 1;
        if (this._stateTiming) state[this._timingState].some(s => this._updateTimingState(s));
    }

    _updateTimingState(newState) {
        if (newState == this.previousState) return false;
        this.previousState = newState;
        this._timingStateChanged(newState);
        return true;
    }
    _timingStateChanged(newState) {
        if (newState == 0) return;
        if (this.trialEndBlockNumber) {
            console.log('WARNING Received new trial state, but already in a trial. Ignoring.');
            return;
        }
        this.trialEndBlockNumber = (this.stateBlockNumber - 1) + this._postTrialBlocks;
        this.onStartTrial();
    }
    _formatData(type, inputData) {
        let data = (type == "Source") ? this.sourceChannels : this.featureChannels;
        return data.reduce(function (obj, ch, i) {
            obj[ch] = inputData[i];
            return obj;
        }, {});
    }

    _connectToData() {
        var manager = this;
        this._bciSourceConnection.connect("ws://127.0.0.1:20100").then(dataConnection => {
            this._bciSourceConnection.onSignalProperties = properties => {
                this.sourceProperties = properties;
                this.sourceChannels = properties.channels;
                if (!this._stateTiming) {
                    if (manager.formatter.sourceChannels.indexOf(manager.formatter._timingChannel) < 0) {
                        console.log('Timing channel not detected; falling back to imprecise timing.');
                        this._stateTiming = true;
                        this.sourceBufferChannels = [];
                    } else {
                        this.sourceBufferChannels = [this._timingChannel];
                    }
                }
                if (this.sourceProperties && this.featureProperties) this._allPropertiesReceived()
            };
            this._bciSourceConnection.onGenericSignal = signal => {
                if (!this.canProcess) {
                    console.log("Received source signal, but can't process it.");
                    return;
                }
                this.sourceBlockNumber += 1;
                if (!this._stateTiming) {
                    var timingIndex = manager.formatter.sourceChannels.indexOf(this._timingChannel);
                    signal[timingIndex].some(s => {
                        if (this.threshold.offValue < this.threshold.onValue) {
                            this._updateTimingState((s >= this.threshold.onValue) ? 1 : 0)
                        } else {
                            this._updateTimingState((s <= this.threshold.onValue) ? 1 : 0)
                        }
                    });
                }
                this.onRawSignal(this._formatData("Source", signal));
            };
            this._bciSourceConnection.onStateFormat = format => {
                if (format[this._timingState] === undefined) {
                    console.log(`WARNING: Desired timing state ${this._timingState} was not detected in the state format for Source.`);
                }
            };
        })

        this._bciFilterConnection.connect("ws://127.0.0.1:20203").then(dataConnection => {
            let manager = this;
            manager._bciFilterConnection.onSignalProperties = properties => {
                manager.featureProperties = properties;
                manager.featureChannels = properties.channels;
                manager.onproperties(properties);
                if (manager.sourceProperties && manager.featureProperties) manager._allPropertiesReceived()
            };
            manager._bciFilterConnection.onGenericSignal = genericSignal => {
                manager._processFeatureSignal(genericSignal);
            };
            manager._bciFilterConnection.onStateVector = stateVector => {
                manager._processStateVector(stateVector);
            };
        })
    }

    _sendTrial() {
        var deltaBlocks = this.featureBlockNumber - this.trialEndBlockNumber;
        this.trialEndBlockNumber = null;
        this.ontrial(this._formatData("Feature", this.featureBuffer.map(dv => {
            return dv.slice(dv.length - deltaBlocks - this._trialBlocks, dv.length - deltaBlocks);
        })));
    }


}



module.exports = {
    OnlineDataSource,
};