export default class Gaussian {
  constructor(mu, s2, n) {
    this.mean = mu;
    this.variance = s2;
    this.count = n;

    if (this.count > 1 && this.variance !== undefined) {
      this._m2 = this.variance * (this.count - 1);
    }
  }
  ingest(datum) {
    let delta = this.mean === undefined ? datum : datum - this.mean;
    count = this.count === undefined ? 1 : this.count + 1;
    mean = this.mean === undefined ? datum : this.mean + delta / this.count;
    _m2 =
      this._m2 === undefined
        ? delta * (datum - this.mean)
        : this._m2 + delta * (datum - this.mean);
    variance = this.count < 2 ? undefined : this._m2 / (this.count - 1);
  }
}

export class ChannelStat {
  constructor(options) {
    if (!options) {
      options = {};
    }
    this.baseline = options.baseline || new Gaussian();
    this.values = options.values || null;
    this.baselineWindow = options.baselineWindow || {
      start: 0,
      end: 10
    };
    this.valueTrials = [];
  }
  recompute(baselineWindow) {
    let stat = this;
    if (baselineWindow) {
      if (baselineWindow.start) {
        this.baselineWindow.start = baselineWindow.start;
      }
      if (baselineWindow.end) {
        this.baselineWindow.end = baselineWindow.end;
      }
    }
    this.baseline = new Gaussian();
    this.values = null;

    this.valueTrials.forEach(trialData => {
      ingest(trialData);
    });
  }
  ingest(data) {
    let baselineData = data.slice(
      this.baselineWindow.start,
      this.baselineWindow.end + 1
    );
    this.ingestValues(data);
    this.ingestBaseline(baselineData);
    this.valueTrials.push(data);
  }
  ingestBaseline(data) {
    let stat = this;
    data.forEach(d => {
      stat.baseline.ingest(d);
    });
  }
  ingestBaseline(data) {
    let stat = this;
    if (!this.values) {
      this.values = [];
      data.forEach(d => {
        stat.values.push(new Gaussian());
      });
    }
    data.forEach((d, i) => {
      stat.values[i].ingest(d);
    });
  }
  meanValues() {
    this.values.map(v => v.mean);
  }
  baselineNormalizedValues() {
    let stat = this;
    return this.values.map(v => {
      if (stat.baseline.variance === undefined) {
        return v.mean - v.baseline.mean;
      }
      return (v.mean - stat.baseline.mean) / Math.sqrt(stat.baseline.variance);
    });
  }
  thresholdValues(threshold) {
    return this.baselineNormalizedValues().map(v => {
      return Math.abs(v) > threshold ? v : 0.0;
    });
  }
  // pointwiseCorrectedValues(alpha, bothWays) {
  //     let twoTailed = true;
  //     if (bothWays !== undefined) {
  //         twoTailed = bothWays;
  //     }
  //     let threshold =
  // }
}
