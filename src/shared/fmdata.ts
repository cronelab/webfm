import { Gaussian, ChannelStat } from "./map/fmstat";

class fmdata {
  metadata: any;
  contents: any;
  displayData: any;
  _channelStats: any;
  _clean: any;
  constructor() {
    this.metadata = {};
    this.contents = {};
    this.displayData = {};
    this._channelStats = {};
    this._clean = true;
  }
  _setupChannelStats() {
    var dataset = this;
    if (this.contents.values !== undefined) {
      this._channelStats = undefined;
      return;
    }
    if (this.contents.stats !== undefined) {
      var stats = this.contents.stats;
      var channels = Object.keys(stats.estimators.mean);
      channels.forEach((ch) => {
        var mean = stats.estimators.mean[ch];
        var variance = stats.estimators.variance[ch];
        var count = stats.estimators.count[ch];
        if (dataset.isTimeseries()) {
          var baselineMean = stats.baseline.mean[ch];
          var baselineVariance = stats.baseline.variance[ch];
          var baselineCount = stats.baseline.count[ch];
          var statValues = mean.map(
            (d: any, i: any) => new Gaussian(mean[i], variance[i], count[i])
          );
          dataset._channelStats[ch] = new ChannelStat({
            baseline: new Gaussian(
              baselineMean,
              baselineVariance,
              baselineCount
            ),
            values: statValues,
          });
        } else {
          dataset._channelStats[ch] = new ChannelStat({
            values: [new Gaussian(mean, variance, count)],
          });
        }
      });
      return;
    }
    if (this.contents.trials !== undefined) {
      var trials = this.contents.trials;
      var channels = Object.keys(trials[0]);
      var newChannelOpts: any = {};
      if (dataset.isTimeseries()) {
        newChannelOpts.baselineWindow = this._windowInSamples(
          dataset.metadata.baselineWindow
        );
      }
      channels.forEach((ch) => {
        var newChannel = new ChannelStat(newChannelOpts);
        trials.forEach((trialData: any) => {
          newChannel.ingest(trialData[ch]);
        });
        dataset._channelStats[ch] = new ChannelStat();
      });
      return;
    }
    this._channelStats = undefined;
  }

  _windowInSamples(windowInSeconds: any) {
    if (!this.isTimeseries()) return undefined;
    if (this.contents === undefined) return undefined;
    if (!Array.isArray(this.contents.times)) return undefined;
    let dataStart = this.contents.times[0];
    let dataEnd = this.contents.times[this.contents.times.length - 1];
    let windowStart =
      ((windowInSeconds.start - dataStart) / dataEnd - dataStart) *
      this.contents.times.length;
    let windowEnd =
      ((windowInSeconds.end - dataStart) / dataEnd - dataStart) *
      this.contents.times.length;
    return {
      start: Math.ceil(windowStart),
      end: Math.floor(windowEnd),
    };
  }

  _updateDisplayData() {
    var dataset = this;
    if (this.contents.values !== undefined) {
      this.displayData = this.contents.values;
      return Promise.resolve();
    }

    if (this.contents.stats !== undefined) {
      return Object.keys(this._channelStats).forEach((ch) => {
        dataset.displayData[ch] = dataset._channelStats[ch].fdrCorrectedValues(
          0.05
        );
      });
    }
  }

  ingest(trialData: any) {
    return new Promise((resolve, reject) => {
      var dataset = this;

      Object.keys(this._channelStats).forEach((ch) =>
        dataset._channelStats[ch].ingest(trialData[ch])
      );

      dataset._updateContentsStats();
      if (dataset.contents.trials === undefined) dataset.contents.trials = [];
      dataset.contents.trials.push(trialData);
      dataset._clean = false;
      dataset._updateDisplayData();
      resolve();
    });
  }

  _updateContentsStats() {
    var dataset = this;
    dataset.contents.stats = dataset.contents.stats || {};
    dataset.contents.stats.distribution = "gaussian";
    dataset.contents.stats.baseline = dataset.contents.stats.baseline || {};
    dataset.contents.stats.baseline.mean =
      dataset.contents.stats.baseline.mean || {};
    dataset.contents.stats.baseline.variance =
      dataset.contents.stats.baseline.variance || {};
    dataset.contents.stats.baseline.count =
      dataset.contents.stats.baseline.count || {};

    dataset.contents.stats.estimators = dataset.contents.stats.estimators || {};
    dataset.contents.stats.estimators.mean =
      dataset.contents.stats.estimators.mean || {};
    dataset.contents.stats.estimators.variance =
      dataset.contents.stats.estimators.variance || {};
    dataset.contents.stats.estimators.count =
      dataset.contents.stats.estimators.count || {};

    Object.keys(this._channelStats).forEach((ch) => {
      dataset.contents.stats.baseline.mean[ch] =
        dataset._channelStats[ch].baseline.mean;
      dataset.contents.stats.baseline.variance[ch] =
        dataset._channelStats[ch].baseline.variance;
      dataset.contents.stats.baseline.count[ch] =
        dataset._channelStats[ch].baseline.count;

      var values = dataset._channelStats[ch].values;

      if (!values) {
        dataset.contents.stats.estimators.mean[ch] = undefined;
        dataset.contents.stats.estimators.variance[ch] = undefined;
        dataset.contents.stats.estimators.count[ch] = undefined;
        return;
      }
      var extractor = (estimator: any) => (v: any) => v[estimator];

      if (!Array.isArray(values)) {
        dataset.contents.stats.estimators.mean[ch] = extractor("mean")(values);
        dataset.contents.stats.estimators.variance[ch] = extractor("variance")(
          values
        );
        dataset.contents.stats.estimators.count[ch] = extractor("count")(
          values
        );
        return;
      }
      dataset.contents.stats.estimators.mean[ch] = values.map(
        extractor("mean")
      );
      dataset.contents.stats.estimators.variance[ch] = values.map(
        extractor("variance")
      );
      dataset.contents.stats.estimators.count[ch] = values.map(
        extractor("count")
      );
    });
  }

  //This is only for Record
  get(data: any) {
    var dataset = this;
    dataset._clean = true;
    let { values, stats, trials } = data.contents;
    return new Promise((resolve, reject) => {
      if (values === undefined && stats === undefined && trials === undefined) {
        reject("Loaded dataset lacks content.");
        return;
      }
      dataset.metadata = data.metadata;
      dataset.contents = data.contents;
      dataset._setupChannelStats();
      dataset._updateDisplayData();
      resolve();
    });

    // return new Promise((resolve, reject) => {
    // 	if (values === undefined && stats === undefined && trials === undefined) {
    // 		reject('Loaded dataset lacks content.');
    // 		return;
    // 	}
    // 	resolve({
    // 		'metadata': Object.assign({}, data.metadata),
    // 		'contents': Object.assign({}, data.contents)
    // 	});
    // }).then(validatedData => {
    // 	dataset.metadata = validatedData.metadata;
    // 	dataset.contents = validatedData.contents;
    // 	dataset._setupChannelStats();
    // }).then(() => dataset._updateDisplayData());
  }

  put(url: any, opts: any) {
    var options = {
      import: false,
    };
    if (opts) Object.assign(options, opts);

    var dataset = this;

    return new Promise((resolve, reject) => {
      // Deep copy
      var dataToSend = JSON.parse(
        JSON.stringify({
          metadata: dataset.metadata,
          contents: dataset.contents,
        })
      );

      if (options.import) dataToSend.metadata["_import"] = options.import;

      fetch(url, {
        method: "PUT",
        body: JSON.stringify(dataToSend),
      }).then((data) => {
        dataset._clean = true;
        resolve(data);
      });
    });
  }

  setupChannels(channels: any) {
    var dataset = this;
    this.metadata.montage = channels;
    if (this._channelStats === undefined) this._channelStats = {};
    channels.forEach((ch: any) => {
      let newBaselineWindow = undefined;
      if (dataset.metadata) newBaselineWindow = dataset.metadata.baselineWindow;
      dataset._channelStats[ch] = new ChannelStat({
        baselineWindow: dataset._windowInSamples(newBaselineWindow),
      });
    });
    this._clean = false;
  }

  isTimeseries() {
    if (this.metadata.labels.indexOf("timeseries") >= 0) {
      return true;
    }

    var someMember = (obj: any): any => {
      var ret = null;
      Object.keys(obj).every((k) => {
        ret = obj[k];
        return false;
      });
      return ret;
    };

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
    return false;
  }

  getTimeBounds() {
    if (!this.isTimeseries() || !this.contents.times) {
      return undefined;
    }

    return {
      start: this.contents.times[0],
      end: this.contents.times[this.contents.times.length - 1],
    };
  }

  updateTimesFromWindow(timeWindow: any, nTimes: any) {
    var newTimes = [];
    for (var i = 0; i < nTimes; i++) {
      newTimes.push(
        timeWindow.start +
          (i / (nTimes - 1)) * (timeWindow.end - timeWindow.start)
      );
    }
    this.contents.times = newTimes;
  }

  getTrialCount() {
    let { trials, stats } = this.contents;
    if (trials !== undefined) {
      return trials.length;
    }
    if (stats !== undefined) {
      if (stats.distribution.toLowerCase() == "gaussian") {
        var counts = stats.estimators.count;
        return Object.keys(counts)
          .reduce((acc, ch) => acc.concat(counts[ch]), [])
          .reduce((a, b) => Math.min(a, b));
      }
    }
    return undefined;
  }

  dataForTime(time: any) {
    if (!this.isTimeseries()) return undefined;
    var dataset = this;
    var dataSamples = 0;
    Object.keys(this.displayData).every(function (ch) {
      dataSamples = dataset.displayData[ch].length;
      return false;
    });

    var dataWindow = {
      start: this.contents.times[0],
      end: this.contents.times[this.contents.times.length - 1],
    };
    var timeIndexFloat =
      ((time - dataWindow.start) / (dataWindow.end - dataWindow.start)) *
      dataSamples;
    var timeIndex = Math.floor(timeIndexFloat);
    var timeFrac = timeIndexFloat - timeIndex;

    let disp = Object.keys(dataset.displayData).reduce(function (obj: any, ch) {
      let ins = dataset.displayData[ch];
      obj[ch] =
        (1.0 - timeFrac) * ins[timeIndex] + timeFrac * ins[timeIndex + 1];
      return obj;
    }, {});

    return disp;
  }

  updateBaselineWindow(newWindow: any) {
    this.metadata.baselineWindow = newWindow;
    var newWindowSamples = this._windowInSamples(newWindow);
    if (newWindowSamples === undefined) return Promise.resolve();
    return Object.keys(this._channelStats).forEach((ch) =>
      this._channelStats[ch].recompute(newWindowSamples)
    );
  }
}

export default fmdata;
