import {
    bciOperator
} from 'bci2k';
import {
    ApolloClient,
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
        this.sourceConnection = null;
        this.spectralConnection = null
        this.trialBufferFull = e => {};
        this.bci = new bciOperator();
        this.bci.connect("127.0.0.1")
        this.bci.onStateChange = e => console.log(e);
        this.stimCode = 0;
        this.onStimCodeChange = e => {}
        this._featureKernel;
        this.blockNumber = 0;
        this.defineProperties = true;
        this.numStims = null;
        this.detectChange = true;
        this.client = new ApolloClient({
            link: createHttpLink({
                uri: 'http://127.0.0.1:3000/graphql',
                credentials: 'same-origin'
            }),
            cache: new InMemoryCache()
        });

    }

    connectToSockets = async () => {

        await new Promise(resolve => setTimeout(resolve, 200));
        this.sourceConnection = await this.bci.tap("Source");
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.spectralConnection = await this.bci.tap("SpectralOutput")

        this.sourceConnection.onReceiveBlock = () => {
            if (this.defineProperties == true) {
                this.setupProperties(
                    this.sourceConnection.signalProperties,
                    this.spectralConnection.signalProperties
                )
                this.defineProperties = false
            }
            this.blockNumber = this.blockNumber + 1;

            // if(this.stimCode != this.sourceConnection.states.StimulusCode[0]){
            //     this.onStimCodeChange(this.sourceConnection.states.StimulusCode[0])
            // }
            // this.stimCode = this.sourceConnection.states.StimulusCode[0];

            // if(this.stimCode != 0){
            //     this.blockNumber = 0;
            // }
            // if(this.blockNumber == 95) // 3 seconds have elapsed
            // {
            //     this.trialBufferFull({
            //         srcBuf: this.sourceBuffer,
            //         spcBuf: this.featureBuffer
            //     })
            // }



            this.sourceConnection.signal.map(e => e.reduce((a, b) => a + b) / e.length)
                .map((d, i) => {
                    this.sourceBuffer[i].shift()
                    this.sourceBuffer[i].push(d)
                })
            // this.spectralConnection.signal.map(dv => dv.reduce((acc, el, iel) => acc + el * this._featureKernel[iel], 0))
            //     .map((d, i) => {
            //         this.featureBuffer[i].shift()
            //         this.featureBuffer[i].push(d)
            //     })

            // let formattedSourceData = this.sourceChannels.reduce((obj, ch, i) => {
            //     obj[ch] = this.sourceBuffer[i];
            //     return obj;
            // }, {});

            this.sourceConnection.signal[122].map(val => {
                if(val > 10 && this.detectChange){
                    this.numStims++
                    console.log(this.numStims)
                    this.detectChange = false;
                }
                else if(val < 1){
                    this.detectChange=true
                }
                })

            // let formattedSpectData = this.featureChannels.reduce((obj, ch, i) => {
            //     obj[ch] = this.featureBuffer[i];
            //     return obj;
            // }, {});
        }
        this.spectralConnection.ondisconnect = e => {
            this.connectToSockets()
        }
    }
    setupProperties = async (sourceProps, specProps) => {
        let subjName = await this.bci.execute(`Get Parameter SubjectName`)
        let dataFile = await this.bci.execute(`Get Parameter DataFile`)
        let taskName = dataFile.split('/')[1]
        let baselineWindow = {};
        let bufferWindow = {};
        let graphQL = await this.client.query({
            query: gql `
              {
                configurations(task: "${taskName}")
              }
            `
        })
        // console.log(graphQL)
        baselineWindow.start = graphQL.data.configurations[0]
        baselineWindow.end = graphQL.data.configurations[1]
        bufferWindow.start = graphQL.data.configurations[2];
        bufferWindow.end = graphQL.data.configurations[3];

        this.sourceChannels = sourceProps.channels;
        this.featureChannels = specProps.channels;
        let blockLengthSeconds = sourceProps.numelements * sourceProps.elementunit.gain; // block size * inverse of sampling rate
        let bufferLengthSeconds = bufferWindow.end - bufferWindow.start;
        let bufferLengthBlocks = Math.ceil(bufferLengthSeconds / blockLengthSeconds);
        // let trialLengthSeconds = bufferWindow.end - bufferWindow.start;
        // let trialBlocks = Math.ceil(trialLengthSeconds / blockLengthSeconds);
        // let postTrialBlocks = Math.ceil(bufferWindow.end / blockLengthSeconds);

        this.sourceBuffer = new Array(this.sourceChannels.length).fill(new Array(bufferLengthBlocks).fill(0))
        this.featureBuffer = new Array(this.featureChannels.length).fill(new Array(bufferLengthBlocks).fill(0))


        let transform = specProps.elementunit;
        let centerFrequencies = specProps.elements.map((e, i) => (Math.abs(transform.offset) + i) * transform.gain);
        let binWidth = transform.gain;
        this._featureKernel = specProps.elements.map(f => 1.0 / centerFrequencies.length)

    }
}