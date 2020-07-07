import gaussian from 'gaussian';



//Output some values
{/* <script type="text/javascript">
document
    .getElementById("twoVsThree")
    .addEventListener("click", function (e) {
        let raster = document.getElementById("fm");
        let maxVals = []
        let meanValues = []
        let chNames = []
        for (var i = 1; i < raster.children.length - 15; i++) {
            var item = raster.children[i];
            maxVals.push(Math.max(...item.children[2].__data__.values))
            let sum = item.children[2].__data__.values.reduce((previous, current) => current +=
                previous);
            let avg = sum / item.children[2].__data__.values.length;
            meanValues.push(avg)
            chNames.push(item.children[2].__data__.channel)
        }

        let maxDict = {}
        let meanDict = {}


        for (let i = 0; i < maxVals.length; i++) {
            if (maxVals[i] > 0) {
                maxDict[`${chNames[i]}`] = maxVals[i]
            }
        }
        for (let i = 0; i < meanValues.length; i++) {
            if (meanValues[i] > 0) {
                meanDict[`${chNames[i]}`] = meanValues[i]
            }
        }
        var maxSortable = [];
        for (var valz in maxDict) {
            maxSortable.push([valz, maxDict[valz]]);
        }

        maxSortable.sort(function (a, b) {
            return a[1] - b[1];
        });
        var meanSortable = [];
        for (var valz in meanDict) {
            meanSortable.push([valz, meanDict[valz]]);
        }

        meanSortable.sort(function (a, b) {
            return a[1] - b[1];
        });
        console.log("Maximum High Gamma Activity")
        console.log(JSON.stringify(maxSortable))
        console.log("Mean High Gamma Activity")
        console.log(meanDict)
        console.log(JSON.stringify(meanSortable)) */}










// export default class Gaussian {
//     constructor(mu, s2, n) {
//         let mean = mu;
//         let variance = s2;
//         let count = n;

//         if (count > 1 && variance !== undefined) {
//             let _m2 = variance * (count - 1)
//         }
//     }
//     ingest(datum) {
//         let delta = (this.mean === undefined) ? datum : datum - this.mean;
//         count = (this.count === undefined) ? 1 : this.count + 1;
//         mean = (this.mean === undefined) ? datum : this.mean + delta / this.count;
//         _m2 = (this._m2 === undefined) ? delta * (datum - this.mean) : this._m2 + delta * (datum - this.mean);
//         variance = (this.count < 2) ? undefined : this._m2 / (this.count - 1);

//     }
// }

// class ChannelStat {
//     constructor(options) {
//         if (!options) {
//             options = {};
//         }
//         this.baseline = options.baseline || new Gaussian();
//         this.values = options.values || null;
//         this.baselineWindow = options.baselineWindow || {
//             start: 0,
//             end: 10
//         };
//         this.valueTrials = [];
//     }
//     recompute(baselineWindow) {
//         let stat = this;
//         if (baselineWindow) {
//             if (baselineWindow.start) {
//                 this.baselineWindow.start = baselineWindow.start;
//             }
//             if (baselineWindow.end) {
//                 this.baselineWindow.end = baselineWindow.end;
//             }
//         }
//         this.baseline = new Gaussian();
//         this.values = null;

//         this.valueTrials.forEach(trialData => {
//             ingest(trialData);
//         });
//     }
//     ingest(data) {
//         let baselineData = data.slice(this.baselineWindow.start, this.baselineWindow.end + 1);
//         this.ingestValues(data);
//         this.ingestBaseline(baselineData);
//         this.valueTrials.push(data);
//     }
//     ingestBaseline(data) {
//         let stat = this;
//         data.forEach(d => {
//             stat.baseline.ingest(d);
//         })
//     }
//     ingestBaseline(data) {
//         let stat = this;
//         if (!this.values) {
//             this.values = [];
//             data.forEach(d => {
//                 stat.values.push(new Gaussian());
//             });
//         }
//         data.forEach((d, i) => {
//             stat.values[i].ingest(d);
//         });
//     }
//     meanValues() {
//         this.values.map(v => v.mean)
//     }
//     baselineNormalizedValues() {
//         let stat = this;
//         return this.values.map(v => {
//             if (stat.baseline.variance === undefined) {
//                 return v.mean - v.baseline.mean;
//             }
//             return (v.mean - stat.baseline.mean) / Math.sqrt(stat.baseline.variance);
//         })
//     }
//     thresholdValues(threshold) {
//         return this.baselineNormalizedValues().map(v => {
//             return (Math.abs(v) > threshold) ? v : 0.0;
//         })
//     }
//     // pointwiseCorrectedValues(alpha, bothWays) {
//     //     let twoTailed = true;
//     //     if (bothWays !== undefined) {
//     //         twoTailed = bothWays;
//     //     }
//     //     let threshold =
//     // }
// }

export class Helpers {
    constructor() {
        let gauss = new gaussian(1, 1);
        console.log(gauss.ppf(Math.random()));

    }
    //     ierfc(x) {
    //         if (x >= 2) return -100;
    //         if (x <= 0) return 100;
    //         let xx = (x < 1) ? x : 2 - x
    //         let t = Math.sqrt(-2 * Math.log(xx / 2))
    //         let r = -0.70711 * ((2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t);

    //         for (let j = 0; j < 2; j++) {
    //             let err = fmstat.erfc(r) - xx;
    //             r += err / (1.12837916709551257 * Math.exp(-(r * r)) - r * err);
    //         }

    //         return (x < 1) ? r : -r;
    //     }
}