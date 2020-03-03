import BCI2K from "bci2k";
var OnlineDataSource = /** @class */ (function () {
    function OnlineDataSource() {
        this.onproperties = function (properties) { };
        this.onBufferCreated = function () { };
        this.onRawSignal = function (rawSignal) { };
        this.onFeatureSignal = function (featureSignal) { };
        this.onStartTrial = function () { };
        this.ontrial = function (trialData) { };
        this.onSystemStateChange = function (newState) { };
        this._bciConnection = new BCI2K.bciOperator();
        this._bciSourceConnection = new BCI2K.bciData();
        this._bciFilterConnection = new BCI2K.bciData();
        this._stateTiming = true;
        this._timingChannel = JSON.parse(localStorage.getItem('options')).stimulus.signal.channel || 'ainp1';
        this._timingState = JSON.parse(localStorage.getItem('options')).stimulus.state.name || 'StimulusCode';
        this.threshold = {
            offValue: 0.0,
            onValue: 1.0
        };
        this.trialWindow = JSON.parse(localStorage.getItem('options')).stimulus.state.window || {
            start: -1.0,
            end: 2.0
        };
        this._bufferPadding = 0.5;
        this._bufferWindow = JSON.parse(localStorage.getItem('options')).stimulus.state.baselineWindow || {
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
    OnlineDataSource.prototype.connect = function (address) {
        var _this = this;
        var manager = this;
        return this._bciConnection.connect(address)
            .then(function (event) {
            _this._bciConnection.stateListen();
            _this._bciConnection.onStateChange = function (currentState) {
                if (currentState == "Running")
                    manager._connectToData();
            };
        });
    };
    OnlineDataSource.prototype._allPropertiesReceived = function () {
        var _this = this;
        // console.log(this)
        var featureFreqs = this.featureProperties.elements.map(function (e) {
            _this.featureProperties.elementunit.offset + (e * _this.featureProperties.elementunit.gain);
        });
        // console.log(featureFreqs)
        this._featureKernel = featureFreqs.map(function (f) { return 1.0 / featureFreqs.length; });
        this._setupBuffers();
    };
    OnlineDataSource.prototype._setupBuffers = function () {
        var blockLengthSeconds = this.sourceProperties.numelements * this.sourceProperties.elementunit.gain;
        var windowLengthSeconds = this._bufferWindow.end - this._bufferWindow.start;
        var windowLengthBlocks = Math.ceil(windowLengthSeconds / blockLengthSeconds);
        this.featureBuffer = this.featureChannels.reduce(function (arr, ch, i) {
            arr.push(Array.apply(null, new Array(windowLengthBlocks)).map(Number.prototype.valueOf, 0));
            return arr;
        }, []);
        this._trialBlocks = Math.ceil((this.trialWindow.end - this.trialWindow.start) / blockLengthSeconds);
        this._postTrialBlocks = Math.ceil(this.trialWindow.end / blockLengthSeconds);
        console.log('Created feature buffer: ' + this.featureChannels.length + ' channels x ' + windowLengthBlocks + ' samples.');
        this.canProcess = true;
        this.onBufferCreated();
    };
    OnlineDataSource.prototype.updateTrialWindow = function (newWindow) {
        if (!newWindow)
            return;
        if (newWindow.start !== undefined) {
            this.trialWindow.start = newWindow.start;
            this._bufferWindow.start = newWindow.start - this._bufferPadding;
        }
        if (newWindow.end !== undefined) {
            this.trialWindow.end = newWindow.end;
            this._bufferWindow.end = newWindow.end + this._bufferPadding;
        }
        this.trialEndBlockNumber = null;
        if (this.canProcess)
            this._setupBuffers();
    };
    OnlineDataSource.prototype._processFeatureSignal = function (signal) {
        var _this = this;
        if (!this.canProcess) {
            console.warn("Received feature signal, but can't process it.");
            return;
        }
        this.featureBlockNumber += 1;
        var computedFeatures = (!this._featureKernel) ? signal.map(function (dv) { return 0.0; }) : signal.map(function (dv) {
            return dv.reduce(function (acc, el, iel) {
                return acc + el * _this._featureKernel[iel];
            }, 0.0);
        });
        this.featureBuffer.forEach(function (fv) { return fv.shift(); });
        computedFeatures.forEach(function (d, i) { return _this.featureBuffer[i].push(d); });
        if (this.trialEndBlockNumber)
            if (this.featureBlockNumber >= this.trialEndBlockNumber)
                this._sendTrial();
        this.onFeatureSignal(this._formatData("Feature", computedFeatures));
    };
    OnlineDataSource.prototype._processStateVector = function (state) {
        var _this = this;
        if (!this.canProcess)
            console.warn("Received a state signal, but can't process it.");
        this.stateBlockNumber += 1;
        if (this._stateTiming)
            state[this._timingState].some(function (s) { return _this._updateTimingState(s); });
    };
    OnlineDataSource.prototype._updateTimingState = function (newState) {
        if (newState == this.previousState)
            return false;
        this.previousState = newState;
        var localOptions = JSON.parse(localStorage.getItem('options'));
        var thresholdValue = localOptions.stimulus.state.onValue;
        var exclusionState = localOptions.stimulus.state.exclude;
        console.log(thresholdValue);
        if (newState == thresholdValue || thresholdValue == 'x' || thresholdValue == 'X' || newState == parseInt(exclusionState)) {
            if (newState == 0)
                return;
            if (this.trialEndBlockNumber) {
                console.warn('WARNING Received new trial state, but already in a trial. Ignoring.');
                return;
            }
            this.trialEndBlockNumber = (this.stateBlockNumber - 1) + this._postTrialBlocks;
            this.onStartTrial();
            return true;
        }
        else {
            return false;
        }
    };
    OnlineDataSource.prototype._formatData = function (type, inputData) {
        var data = (type == "Source") ? this.sourceChannels : this.featureChannels;
        return data.reduce(function (obj, ch, i) {
            obj[ch] = inputData[i];
            return obj;
        }, {});
    };
    OnlineDataSource.prototype._connectToData = function () {
        var _this = this;
        var manager = this;
        this._bciSourceConnection.connect("ws://" + localStorage.getItem('source-address') + ":20100").then(function (dataConnection) {
            _this._bciSourceConnection.onSignalProperties = function (properties) {
                _this.sourceProperties = properties;
                _this.sourceChannels = properties.channels;
                if (!_this._stateTiming) {
                    if (manager.sourceChannels.indexOf(manager._timingChannel) < 0) {
                        console.log('Timing channel not detected; falling back to imprecise timing.');
                        _this._stateTiming = true;
                        _this.sourceBufferChannels = [];
                    }
                    else {
                        _this.sourceBufferChannels = [_this._timingChannel];
                    }
                }
                if (_this.sourceProperties && _this.featureProperties)
                    _this._allPropertiesReceived();
            };
            _this._bciSourceConnection.onGenericSignal = function (signal) {
                if (!_this.canProcess) {
                    console.warn("Received source signal, but can't process it.");
                    return;
                }
                _this.sourceBlockNumber += 1;
                if (!_this._stateTiming) {
                    var timingIndex = manager.formatter.sourceChannels.indexOf(_this._timingChannel);
                    signal[timingIndex].some(function (s) {
                        if (_this.threshold.offValue < _this.threshold.onValue) {
                            _this._updateTimingState((s >= _this.threshold.onValue) ? 1 : 0);
                        }
                        else {
                            _this._updateTimingState((s <= _this.threshold.onValue) ? 1 : 0);
                        }
                    });
                }
                _this.onRawSignal(_this._formatData("Source", signal));
            };
            _this._bciSourceConnection.onStateFormat = function (format) {
                if (format[_this._timingState] === undefined) {
                    console.log("WARNING: Desired timing state " + _this._timingState + " was not detected in the state format for Source.");
                }
            };
        });
        this._bciFilterConnection.connect("ws://" + localStorage.getItem('source-address') + ":20203").then(function (dataConnection) {
            var manager = _this;
            manager._bciFilterConnection.onSignalProperties = function (properties) {
                manager.featureProperties = properties;
                manager.featureChannels = properties.channels;
                manager.onproperties(properties);
                if (manager.sourceProperties && manager.featureProperties)
                    manager._allPropertiesReceived();
            };
            manager._bciFilterConnection.onGenericSignal = function (genericSignal) {
                manager._processFeatureSignal(genericSignal);
            };
            manager._bciFilterConnection.onStateVector = function (stateVector) {
                manager._processStateVector(stateVector);
            };
        });
    };
    OnlineDataSource.prototype._sendTrial = function () {
        var _this = this;
        var deltaBlocks = this.featureBlockNumber - this.trialEndBlockNumber;
        this.trialEndBlockNumber = null;
        this.ontrial(this._formatData("Feature", this.featureBuffer.map(function (dv) {
            return dv.slice(dv.length - deltaBlocks - _this._trialBlocks, dv.length - deltaBlocks);
        })));
    };
    return OnlineDataSource;
}());
export default OnlineDataSource;
// module.exports = OnlineDataSource;
// //TODO from main.js
// //datasets/bundles
// //Initialize source/spectral buffers
// //Save metadata
// import {
//     generateChart
// } from "../timeSeries";
// import {
//     Helpers
// } from './stats';
// window.onload = () => {
//     const getTaskParameters = async () => {
//         let firstBin = await bciWatcher.getParameter("FirstBinCenter")
//         let lastBin = await bciWatcher.getParameter("LastBinCenter");
//         let stimDuration = await bciWatcher.getParameter("StimulusDuration")
//         let minISI = await bciWatcher.getParameter("ISIMinDuration")
//         let maxISI = await bciWatcher.getParameter("ISIMaxDuration")
//         console.log(firstBin, lastBin, stimDuration, minISI, maxISI)
//     }
//     sourceData.onSignalProperties = sigProps => {
//         console.log(sigProps);
//         console.log(sigProps.channels.length);
//         console.log(sigProps.numElements);
//         let chan = sigProps.channels.length;
//         let sampB = sigProps.numelements;
//         if (sampB) {
//             sendSourceData(chan, sampB);
//         }
//     };
//     const sendSourceData = (numChannels, sampleBlockSize) => {
//         let timeBuffer = [];
//         for (let i = 0; i < numChannels; i++) {
//             timeBuffer.push([]);
//         }
//         sourceData.onGenericSignal = timeData => {
//             console.log(timeBuffer);
//             timeData.map((ch, i) => {
//                 console.log(timeBuffer[i].length);
//                 if (timeBuffer[i].length == sampleBlockSize) {
//                     // generateChart(timeBuffer[i]);
//                     timeBuffer[i].splice(0, sampleBlockSize);
//                     timeBuffer[i] = timeBuffer[i].concat(ch);
//                 } else {
//                     timeBuffer[i] = timeBuffer[i].concat(ch);
//                 }
//             });
//         };
//     };
//# sourceMappingURL=fmonline.js.map