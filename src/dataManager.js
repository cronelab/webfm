import {
    bciOperator
} from 'bci2k';
import {
    ApolloClient,
    HttpLink,
    InMemoryCache
} from 'apollo-client-preset';
import {
    createHttpLink
} from 'apollo-link-http';
import gql from 'graphql-tag';

export default class DataManager {
    constructor() {
        this.sourceBuffer = null;
        this.featureBuffer = null;
        this.sourceChannels = null;
        this.featureChannels = null;

        this.trialWindow = {
            start: -1,
            end: 3.0
        }
        this.bufferWindow = {
            start: this.trialWindow.start - 0.5,
            end: this.trialWindow.end + 0.5
        }
        this.bci = new bciOperator();
        this._featureKernel;
        this.blockNumber = 0;
        this.defineProperties = true;

        this.client = new ApolloClient({
            link: createHttpLink({
                uri: 'http://127.0.0.1:3000/graphql',
                credentials: 'same-origin'
            }),
            cache: new InMemoryCache()
        });
    }

    connectToSockets = async () => {

        let taskName = "AutoStim"

        this.client
            .query({
                query: gql `
              {
                configurations(task: "${taskName}")
              }
            `
            })
            .then(result => {
                this.bufferWindow.start = result.data.configurations[0]
                this.bufferWindow.end = result.data.configurations[1]
            });
        this.bci.connect("127.0.0.1")
        this.bci.onStateChange = e => console.log(e);
        await new Promise(resolve => setTimeout(resolve, 200));
        let sourceConnection = await this.bci.tap("Source");
        let spectralConnection = await this.bci.tap("SpectralOutput")

        sourceConnection.onReceiveBlock = () => {
            if (this.defineProperties == true) {
                this.setupProperties(
                    sourceConnection.signalProperties,
                    spectralConnection.signalProperties
                )
                this.defineProperties = false
            }
            console.log(sourceConnection.states);
            let stimCode = sourceConnection.states.StimulusCode
            let sourceSignal = sourceConnection.signal
            let spectSignal = spectralConnection.signal
            this.blockNumber = this.blockNumber + 1;
            sourceSignal.map(e => e.reduce((a, b) => a + b) / e.length)
                .forEach((d, i) => {
                    this.sourceBuffer[i].shift()
                    this.sourceBuffer[i].push(d)

                })

            spectSignal.map(dv => dv.reduce((acc, el, iel) => acc + el * this._featureKernel[iel], 0.0))
                .forEach((d, i) => {
                    this.featureBuffer[i].shift()
                    this.featureBuffer[i].push(d)
                })

            let formattedSourceData = this.sourceChannels.reduce((obj, ch, i) => {
                obj[ch] = this.sourceBuffer[i];
                return obj;
            }, {});

            let formattedSpectData = this.featureChannels.reduce((obj, ch, i) => {
                obj[ch] = this.featureBuffer[i];
                return obj;
            }, {});

            console.log(formattedSourceData);
            console.log(formattedSpectData);
        }
        spectralConnection.ondisconnect = e => {
            console.log(e);
        }
    }
    setupProperties = (sourceProps, specProps) => {
        this.sourceChannels = sourceProps.channels;
        this.featureChannels = specProps.channels;
        console.log(this.bufferWindow);
        let blockLengthSeconds = sourceProps.numelements * sourceProps.elementunit.gain; // block size * inverse of sampling rate
        let windowLengthSeconds = this.bufferWindow.end - this.bufferWindow.start;
        let windowLengthBlocks = Math.ceil(windowLengthSeconds / blockLengthSeconds);
        
        this.sourceBuffer = new Array(this.sourceChannels.length).fill(new Array(windowLengthBlocks).fill(0))
        this.featureBuffer = new Array(this.featureChannels.length).fill(new Array(windowLengthBlocks).fill(0))
        let trialLengthSeconds = this.trialWindow.end - this.trialWindow.start;
        let trialBlocks = Math.ceil(trialLengthSeconds / blockLengthSeconds);
        let postTrialBlocks = Math.ceil(this.trialWindow.end / blockLengthSeconds);
        let transform = specProps.elementunit;
        let featureFreqs = specProps.elements.map(e => transform.offset + (e * transform.gain));
        this._featureKernel = featureFreqs.map(f => 1.0 / featureFreqs.length)

    }
}