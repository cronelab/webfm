import BCI2K from "bci2k";

class SourceStream {
    constructor() {
        this._bciConnection = new BCI2K.bciOperator();
        this._bciSourceConnection = new BCI2K.bciData();
        this.sourceProperties = null;
        this.sourceChannels = null;
        this.timingStrategy = "signal"
        this._timingChannel = "ainp2"
        this.sourceBufferChannels = null;
        this.trialWindow = {
            start: -0.5,
            end: 1.5
        };
        this._bufferPadding = 0.1;
        this._bufferWindow = {
            start: this.trialWindow.start - this._bufferPadding,
            end: this.trialWindow.end + this._bufferPadding
        };
        this.sourceBuffer = null
        this._trialBlocks = null
        this._postTrialBlocks = null
        this.canProcess = false
        this.sourceBlockNumber = 0
        this.threshold = 10
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

    _connectToData() {
        var manager = this;
        this._bciSourceConnection.connect(`ws://${localStorage.getItem('source-address')}:20100`).then(dataConnection => {
            manager._bciSourceConnection.onSignalProperties = properties => {
                console.log(properties)
                manager.sourceProperties = properties;
                manager.sourceChannels = properties.channels;
                if (manager.timingStrategy == "signal") {
                    if (manager.sourceChannels.indexOf(manager._timingChannel) < 0) {
                        manager.sourceBufferChannels = [];
                    } else {
                        manager.sourceBufferChannels = [manager._timingChannel];
                    }
                }
                if (manager.sourceProperties) {
                    let blockLengthSeconds = this.sourceProperties.numelements * this.sourceProperties.elementunit.gain;
                    let windowLengthSeconds = this._bufferWindow.end - this._bufferWindow.start;
                    let windowLengthBlocks = Math.ceil(windowLengthSeconds / blockLengthSeconds);
                    this.sourceBuffer = this.sourceChannels.reduce(function (arr, ch, i) {
                        arr.push(Array.apply(null, new Array(windowLengthBlocks)).map(Number.prototype.valueOf, 0));
                        return arr;
                    }, []);
                    this._trialBlocks = Math.ceil((this.trialWindow.end - this.trialWindow.start) / blockLengthSeconds);
                    this._postTrialBlocks = Math.ceil(this.trialWindow.end / blockLengthSeconds);
                    this.canProcess = true;
                }
            };


            let dummyBuffer = []
            let buffer = []
            let blockNum = 0
            let blockIndex;
            let tempBuffer = []
            this._bciSourceConnection.onGenericSignal = signal => {
                if (!this.canProcess) {
                    console.warn("Received source signal, but can't process it.");
                    return;
                }
                let data = this.sourceChannels.reduce(function (obj, ch, i) {
                    obj[ch] = signal[i];
                    return obj;
                }, {});

                // dummyBuffer = dummyBuffer.concat(data[this._timingChannel])
                dummyBuffer = dummyBuffer.concat(data)
                if (this.timingStrategy == "signal") {
                    for (let i = 0; i <= data[this._timingChannel].length; i++) {
                        if (data[this._timingChannel][i] > this.threshold && i != 0) {
                            dummyBuffer.forEach(bufferedData => {
                                Object.keys(bufferedData).forEach(x => {
                                    console.log(bufferedData[x])
                                })
                                // buffer.push(dummyBuffer.slice(-600 + i, dummyBuffer.length - 100 + i))
                                // tempBuffer.push(bufferedData[this._timingChannel].slice(-600 + i, bufferedData[this._timingChannel].length - 100 + i))
                            })
                            console.log(tempBuffer)
                            // blockIndex = i
                            // blockNum = 0;
                            dummyBuffer = []

                            break
                        }
                    }
                }
                // blockNum++;
                // if (blockNum == 16) {
                //     let newVals = dummyBuffer.slice(-blockNum * 100 + blockIndex, dummyBuffer.length - 100 + blockIndex);
                //     buffer[buffer.length - 1].push(newVals)
                //     buffer[buffer.length - 1] = buffer[buffer.length - 1].flat()
                // }
                // console.log(buffer)

                // if (!this._stateTiming) {
                //     var timingIndex = manager.formatter.sourceChannels.indexOf(this._timingChannel);
                //     signal[timingIndex].some(s => {
                //         if (this.threshold.offValue < this.threshold.onValue) {
                //             this._updateTimingState((s >= this.threshold.onValue) ? 1 : 0)
                //         } else {
                //             this._updateTimingState((s <= this.threshold.onValue) ? 1 : 0)
                //         }
                //     });
                // }


                // console.log(data.ainp2[0])
                // this.onRawSignal(data);
            };
            // this._bciSourceConnection.onStateFormat = format => {
            //     if (format[this._timingState] === undefined) {
            //         console.log(`WARNING: Desired timing state ${this._timingState} was not detected in the state format for Source.`);
            //     }
            // };
        })
    }

}

// class StreamManager {
//     constructor() {
//         this.onproperties = properties => { };
//         this.onBufferCreated = () => { };
//         this.onRawSignal = rawSignal => { };
//         this.onFeatureSignal = featureSignal => { };
//         this.onStartTrial = () => { };
//         this.ontrial = trialData => { };
//         this.onSystemStateChange = newState => { };
//         this._bciConnection = new BCI2K.bciOperator();
//         this._bciFilterConnection = new BCI2K.bciData();
//         this._stateTiming = true;
//         this._timingChannel = 'ainp1';
//         this._timingState = 'StimulusCode';
//         this.threshold = {
//             offValue: 0.0,
//             onValue: 1.0
//         };

//         this._featureKernel = null;
//         this._frameBlocks = null;
//         this._trialBlocks = null;
//         this._postTrialBlocks = null;
//         this.canProcess = false;
//         this.sourceChannels = null;
//         this.sourceProperties = null;
//         this.sourceBuffer = null;
//         this.sourceBufferChannels = null;
//         this.sourceBlockNumber = 0;
//         this.featureChannels = null;
//         this.featureProperties = null;
//         this.featureBuffer = null;
//         this.featureBlockNumber = 0;
//         this.previousState = null;
//         this.stateBlockNumber = 0;
//         this.trialEndBlockNumber = null;

//     }



//     _setupBuffers() {
//         let blockLengthSeconds = this.sourceProperties.numelements * this.sourceProperties.elementunit.gain;
//         let windowLengthSeconds = this._bufferWindow.end - this._bufferWindow.start;
//         let windowLengthBlocks = Math.ceil(windowLengthSeconds / blockLengthSeconds);
//         this.featureBuffer = this.featureChannels.reduce(function (arr, ch, i) {
//             arr.push(Array.apply(null, new Array(windowLengthBlocks)).map(Number.prototype.valueOf, 0));
//             return arr;
//         }, []);
//         console.log(blockLengthSeconds)
//         console.log(windowLengthSeconds)
//         console.log(windowLengthBlocks)
//         this._trialBlocks = Math.ceil((this.trialWindow.end - this.trialWindow.start) / blockLengthSeconds);
//         this._postTrialBlocks = Math.ceil(this.trialWindow.end / blockLengthSeconds);
//         console.log('Created feature buffer: ' + this.featureChannels.length + ' channels x ' + windowLengthBlocks + ' samples.');
//         this.canProcess = true;
//         this.onBufferCreated();
//     }

//     updateTrialWindow(newWindow) {
//         if (!newWindow) return;
//         if (newWindow.start !== undefined) {
//             this.trialWindow.start = newWindow.start;
//             this._bufferWindow.start = newWindow.start - this._bufferPadding;
//         }
//         if (newWindow.end !== undefined) {
//             this.trialWindow.end = newWindow.end;
//             this._bufferWindow.end = newWindow.end + this._bufferPadding;
//         }
//         this.trialEndBlockNumber = null;
//         if (this.canProcess) this._setupBuffers();
//     }

//     _processFeatureSignal(signal) {
//         if (!this.canProcess) {
//             console.warn("Received feature signal, but can't process it.");
//             return;
//         }
//         this.featureBlockNumber += 1;

//         let computedFeatures = (!this._featureKernel) ? signal.map(dv => 0.0) : signal.map(dv => {
//             return dv.reduce((acc, el, iel) => {
//                 return acc + el * this._featureKernel[iel];
//             }, 0.0);
//         });

//         this.featureBuffer.forEach(fv => fv.shift());
//         computedFeatures.forEach((d, i) => this.featureBuffer[i].push(d));
//         if (this.trialEndBlockNumber)
//             if (this.featureBlockNumber >= this.trialEndBlockNumber) this._sendTrial();
//         this.onFeatureSignal(this._formatData("Feature", computedFeatures));
//     }
//     _processStateVector(state) {
//         console.log(state)
//         if (!this.canProcess) console.warn("Received a state signal, but can't process it.");
//         this.stateBlockNumber += 1;
//         if (this._stateTiming) state[this._timingState].some(s => this._updateTimingState(s));
//     }

//     _updateTimingState(newState) {
//         if (newState == this.previousState) return false;
//         this.previousState = newState;
//         this._timingStateChanged(newState);
//         return true;
//     }
//     _timingStateChanged(newState) {
//         if (newState == 0) return;
//         if (this.trialEndBlockNumber) {
//             console.warn('WARNING Received new trial state, but already in a trial. Ignoring.');
//             return;
//         }
//         this.trialEndBlockNumber = (this.stateBlockNumber - 1) + this._postTrialBlocks;
//         this.onStartTrial();
//     }
//     _formatData(type, inputData) {
//         let data = (type == "Source") ? this.sourceChannels : this.featureChannels;
//         return data.reduce(function (obj, ch, i) {
//             obj[ch] = inputData[i];
//             return obj;
//         }, {});
//     }

//     _connectToData() {
//         var manager = this;
//         this._bciFilterConnection.connect(`ws://${localStorage.getItem('source-address')}:20203`).then(dataConnection => {
//             let manager = this;
//             manager._bciFilterConnection.onSignalProperties = properties => {
//                 manager.featureProperties = properties;
//                 manager.featureChannels = properties.channels;
//                 manager.onproperties(properties);
//                 if (manager.sourceProperties && manager.featureProperties) manager._allPropertiesReceived()
//             };
//             manager._bciFilterConnection.onGenericSignal = genericSignal => {
//                 manager._processFeatureSignal(genericSignal);
//             };
//             manager._bciFilterConnection.onStateVector = stateVector => {
//                 manager._processStateVector(stateVector);
//             };
//         })
//     }

//     _sendTrial() {
//         var deltaBlocks = this.featureBlockNumber - this.trialEndBlockNumber;
//         this.trialEndBlockNumber = null;
//         this.ontrial(this._formatData("Feature", this.featureBuffer.map(dv => {
//             return dv.slice(dv.length - deltaBlocks - this._trialBlocks, dv.length - deltaBlocks);
//         })));
//     }
// }



module.exports = {
    // StreamManager,
    SourceStream,
    // FilterStream
};