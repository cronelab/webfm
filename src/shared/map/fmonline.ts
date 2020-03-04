import BCI2K from "bci2k";

export default class OnlineDataSource {
	onproperties: any;
	onBufferCreated: any;
	onRawSignal: any;
	onFeatureSignal: any;
	onStartTrial: any;
	ontrial: any;
	onSystemStateChange: any;
	_bciConnection: any;
	_bciSourceConnection: any;
	_bciFilterConnection: any;
	_stateTiming: any;
	_timingChannel: any;
	_timingState: any;
	threshold: any;
	trialWindow: any;
	_bufferPadding: any;
	_bufferWindow: any;
	_featureKernel: any;
	_frameBlocks: any;
	_trialBlocks: any;
	_postTrialBlocks: any;
	canProcess: any;
	sourceChannels: any;
	sourceProperties: any;
	sourceBuffer: any;
	sourceBufferChannels: any;
	sourceBlockNumber: any;
	featureChannels: any;
	featureProperties: any;
	featureBuffer: any;
	featureBlockNumber: any;
	previousState: any;
	stateBlockNumber: any;
	trialEndBlockNumber: any;
	formatter: any;
	constructor() {
		this.onproperties = (properties: any) => { };
		this.onBufferCreated = () => { };
		this.onRawSignal = (rawSignal: any) => { };
		this.onFeatureSignal = (featureSignal: any) => { };
		this.onStartTrial = () => { };
		this.ontrial = (trialData: any) => { };
		this.onSystemStateChange = (newState: any) => { };
		this._bciConnection = new BCI2K.bciOperator();
		this._bciSourceConnection = new BCI2K.bciData();
		this._bciFilterConnection = new BCI2K.bciData();
		this._stateTiming = true;
		this._timingChannel = JSON.parse(localStorage.getItem('options')).stimulus.signal.channel || 'ainp1'
		this._timingState = JSON.parse(localStorage.getItem('options')).stimulus.state.name || 'StimulusCode'
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
	connect(address: string) {
		var manager = this;
		return this._bciConnection.connect(address)
			.then((event: any) => {
				this._bciConnection.stateListen()
				this._bciConnection.onStateChange = (currentState: string) => {
					if (currentState == "Running") manager._connectToData();
				}
			});
	}
	_allPropertiesReceived() {
		// console.log(this)
		let featureFreqs = this.featureProperties.elements.map((e: any) => {
			this.featureProperties.elementunit.offset + (e * this.featureProperties.elementunit.gain)
		});
		// console.log(featureFreqs)
		this._featureKernel = featureFreqs.map((f: any) => 1.0 / featureFreqs.length);
		this._setupBuffers();
	}

	_setupBuffers() {
		let blockLengthSeconds = this.sourceProperties.numelements * this.sourceProperties.elementunit.gain;
		let windowLengthSeconds = this._bufferWindow.end - this._bufferWindow.start;
		let windowLengthBlocks = Math.ceil(windowLengthSeconds / blockLengthSeconds);
		this.featureBuffer = this.featureChannels.reduce(function (arr: any, ch: any, i: any) {
			arr.push(Array.apply(null, new Array(windowLengthBlocks)).map(Number.prototype.valueOf, 0));
			return arr;
		}, []);
		this._trialBlocks = Math.ceil((this.trialWindow.end - this.trialWindow.start) / blockLengthSeconds);
		this._postTrialBlocks = Math.ceil(this.trialWindow.end / blockLengthSeconds);
		console.log('Created feature buffer: ' + this.featureChannels.length + ' channels x ' + windowLengthBlocks + ' samples.');
		this.canProcess = true;
		this.onBufferCreated();
	}

	updateTrialWindow(newWindow: any) {
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

	_processFeatureSignal(signal: any) {
		if (!this.canProcess) {
			console.warn("Received feature signal, but can't process it.");
			return;
		}
		this.featureBlockNumber += 1;

		let computedFeatures = (!this._featureKernel) ? signal.map((dv: any) => 0.0) : signal.map((dv: any) => {
			return dv.reduce((acc: any, el: any, iel: any) => {
				return acc + el * this._featureKernel[iel];
			}, 0.0);
		});

		this.featureBuffer.forEach((fv: any) => fv.shift());
		computedFeatures.forEach((d: any, i: any) => this.featureBuffer[i].push(d));
		if (this.trialEndBlockNumber)
			if (this.featureBlockNumber >= this.trialEndBlockNumber) this._sendTrial();
		this.onFeatureSignal(this._formatData("Feature", computedFeatures));
	}
	_processStateVector(state: any) {
		if (!this.canProcess) console.warn("Received a state signal, but can't process it.");
		this.stateBlockNumber += 1;
		if (this._stateTiming) state[this._timingState].some((s: any) => this._updateTimingState(s));
	}

	_updateTimingState(newState: any) {
		if (newState == this.previousState) return false;
		this.previousState = newState;
		let localOptions = JSON.parse(localStorage.getItem('options'))
		let thresholdValue = localOptions.stimulus.state.onValue
		let exclusionState = localOptions.stimulus.state.exclude
		console.log(thresholdValue);
		if (newState == thresholdValue || thresholdValue == 'x' || thresholdValue == 'X' || newState == parseInt(exclusionState)) {
			if (newState == 0) return;
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
	}
	_formatData(type: any, inputData: any) {
		let data = (type == "Source") ? this.sourceChannels : this.featureChannels;
		return data.reduce(function (obj: any, ch: any, i: any) {
			obj[ch] = inputData[i];
			return obj;
		}, {});
	}

	_connectToData() {
		var manager = this;
		this._bciSourceConnection.connect(`ws://${localStorage.getItem('source-address')}:20100`).then((dataConnection: any) => {
			this._bciSourceConnection.onSignalProperties = (properties: any) => {
				this.sourceProperties = properties;
				this.sourceChannels = properties.channels;
				if (!this._stateTiming) {
					if (manager.sourceChannels.indexOf(manager._timingChannel) < 0) {
						console.log('Timing channel not detected; falling back to imprecise timing.');
						this._stateTiming = true;
						this.sourceBufferChannels = [];
					} else {
						this.sourceBufferChannels = [this._timingChannel];
					}
				}
				if (this.sourceProperties && this.featureProperties) this._allPropertiesReceived()
			};
			this._bciSourceConnection.onGenericSignal = (signal: any) => {
				if (!this.canProcess) {
					console.warn("Received source signal, but can't process it.");
					return;
				}
				this.sourceBlockNumber += 1;
				if (!this._stateTiming) {
					var timingIndex = manager.formatter.sourceChannels.indexOf(this._timingChannel);
					signal[timingIndex].some((s: any) => {
						if (this.threshold.offValue < this.threshold.onValue) {
							this._updateTimingState((s >= this.threshold.onValue) ? 1 : 0)
						} else {
							this._updateTimingState((s <= this.threshold.onValue) ? 1 : 0)
						}
					});
				}
				this.onRawSignal(this._formatData("Source", signal));
			};
			this._bciSourceConnection.onStateFormat = (format: any) => {
				if (format[this._timingState] === undefined) {
					console.log(`WARNING: Desired timing state ${this._timingState} was not detected in the state format for Source.`);
				}
			};
		})

		this._bciFilterConnection.connect(`ws://${localStorage.getItem('source-address')}:20203`).then((dataConnection: any) => {
			let manager = this;
			manager._bciFilterConnection.onSignalProperties = (properties: any) => {
				manager.featureProperties = properties;
				manager.featureChannels = properties.channels;
				manager.onproperties(properties);
				if (manager.sourceProperties && manager.featureProperties) manager._allPropertiesReceived()
			};
			manager._bciFilterConnection.onGenericSignal = (genericSignal: any) => {
				manager._processFeatureSignal(genericSignal);
			};
			manager._bciFilterConnection.onStateVector = (stateVector: any) => {
				manager._processStateVector(stateVector);
			};
		})
	}

	_sendTrial() {
		var deltaBlocks = this.featureBlockNumber - this.trialEndBlockNumber;
		this.trialEndBlockNumber = null;
		this.ontrial(this._formatData("Feature", this.featureBuffer.map((dv: any) => {
			return dv.slice(dv.length - deltaBlocks - this._trialBlocks, dv.length - deltaBlocks);
		})));
	}


}



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

