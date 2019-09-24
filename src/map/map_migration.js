//TODO from main.js
//datasets/bundles
//Initialize source/spectral buffers
//Save metadata

import {
    generateChart
} from "../timeSeries";
import {
    Helpers
} from './stats';
window.onload = () => {

    const getTaskParameters = async () => {
        let firstBin = await bciWatcher.getParameter("FirstBinCenter")
        let lastBin = await bciWatcher.getParameter("LastBinCenter");
        let stimDuration = await bciWatcher.getParameter("StimulusDuration")
        let minISI = await bciWatcher.getParameter("ISIMinDuration")
        let maxISI = await bciWatcher.getParameter("ISIMaxDuration")
        console.log(firstBin, lastBin, stimDuration, minISI, maxISI)
    }

    sourceData.onSignalProperties = sigProps => {
        console.log(sigProps);
        console.log(sigProps.channels.length);
        console.log(sigProps.numElements);

        let chan = sigProps.channels.length;
        let sampB = sigProps.numelements;
        if (sampB) {
            sendSourceData(chan, sampB);
        }
    };

    const sendSourceData = (numChannels, sampleBlockSize) => {
        let timeBuffer = [];
        for (let i = 0; i < numChannels; i++) {
            timeBuffer.push([]);
        }
        sourceData.onGenericSignal = timeData => {
            console.log(timeBuffer);
            timeData.map((ch, i) => {
                console.log(timeBuffer[i].length);
                if (timeBuffer[i].length == sampleBlockSize) {
                    // generateChart(timeBuffer[i]);
                    timeBuffer[i].splice(0, sampleBlockSize);
                    timeBuffer[i] = timeBuffer[i].concat(ch);
                } else {
                    timeBuffer[i] = timeBuffer[i].concat(ch);
                }
            });
        };
    };

