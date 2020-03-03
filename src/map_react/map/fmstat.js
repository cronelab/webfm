var Gaussian = /** @class */ (function () {
    function Gaussian(mu, s2, n) {
        this.mean = mu;
        this.variance = s2;
        this.count = n;
        this._m2 = (this.count > 1 && this.variance !== undefined) ? this.variance * (this.count - 1) : undefined;
    }
    Gaussian.prototype.ingest = function (datum) {
        var delta = (this.mean === undefined) ? datum : datum - this.mean;
        this.count = (this.count === undefined) ? 1 : this.count + 1;
        this.mean = (this.mean === undefined) ? datum : this.mean + delta / this.count;
        this._m2 = (this._m2 === undefined) ? delta * (datum - this.mean) : this._m2 + delta * (datum - this.mean);
        this.variance = (this.count < 2) ? undefined : this._m2 / (this.count - 1);
    };
    return Gaussian;
}());
;
var ChannelStat = /** @class */ (function () {
    function ChannelStat(options) {
        if (!options)
            options = {};
        this.baseline = options.baseline || new Gaussian();
        this.values = options.values || null;
        this.baselineWindow = options.baselineWindow || {
            start: 0,
            end: 10
        };
        this.valueTrials = [];
    }
    ChannelStat.prototype.recompute = function (baselineWindow) {
        var stat = this;
        if (baselineWindow) {
            if (baselineWindow.start) {
                this.baselineWindow.start = baselineWindow.start;
            }
            if (baselineWindow.end) {
                this.baselineWindow.end = baselineWindow.end;
            }
        }
        // Reset the stat values to defaults
        this.baseline = new Gaussian();
        this.values = null;
        // Recompute all the data anew
        this.valueTrials.forEach(function (trialData) { return stat.ingest(trialData); });
    };
    ChannelStat.prototype.ingest = function (data) {
        var baselineData = data.slice(this.baselineWindow.start, this.baselineWindow.end + 1);
        // Compute summary statistics
        this.ingestValues(data);
        this.ingestBaseline(baselineData);
        // Aggregate new trial data
        this.valueTrials.push(data);
    };
    ChannelStat.prototype.ingestBaseline = function (data) {
        var stat = this;
        // Add each datum to the baseline distribution
        data.forEach(function (d) { return stat.baseline.ingest(d); });
    };
    ChannelStat.prototype.ingestValues = function (data) {
        var stat = this;
        if (!this.values) {
            this.values = [];
            data.forEach(function (d) { return stat.values.push(new Gaussian()); });
        }
        data.forEach(function (d, i) { return stat.values[i].ingest(d); });
    };
    ChannelStat.prototype.meanValues = function () {
        return this.values.map(function (v) { return v.mean; });
    };
    ChannelStat.prototype.baselineNormalizedValues = function () {
        // TODO Wrong form of baseline normalization; should use SEM units?
        // TODO Check limit description in maxcog demo notebook.
        var stat = this;
        return this.values.map(function (v) {
            if (stat.baseline.variance === undefined)
                return v.mean - stat.baseline.mean;
            return (v.mean - stat.baseline.mean) / Math.sqrt(stat.baseline.variance);
        });
    };
    ChannelStat.prototype._thresholdedValues = function (threshold) {
        return this.baselineNormalizedValues().map(function (v) { return (Math.abs(v) > threshold) ? v : 0.0; });
    };
    ChannelStat.prototype.erfc = function (x) {
        var z = Math.abs(x);
        var t = 1 / (1 + z / 2);
        var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 +
            t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
                t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
                    t * (-0.82215223 + t * 0.17087277)))))))));
        return x >= 0 ? r : 2 - r;
    };
    ChannelStat.prototype.ierfc = function (x) {
        if (x >= 2)
            return -100;
        if (x <= 0)
            return 100;
        var xx = (x < 1) ? x : 2 - x;
        var t = Math.sqrt(-2 * Math.log(xx / 2));
        var r = -0.70711 * ((2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t);
        for (var j = 0; j < 2; j++) {
            var err = this.erfc(r) - xx;
            r += err / (1.12837916709551257 * Math.exp(-(r * r)) - r * err);
        }
        return (x < 1) ? r : -r;
    };
    ChannelStat.prototype.ppfn = function (x, mean, variance) {
        return mean - Math.sqrt(2 * variance) * this.ierfc(2 * x);
    };
    ChannelStat.prototype.pointwiseCorrectedValues = function (alpha, bothWays) {
        var twoTailed = true;
        if (bothWays !== undefined) {
            twoTailed = bothWays;
        }
        var threshold = this.ppfn(1 - (alpha / (twoTailed ? 2 : 1)), 0.0, 1.0);
        return this._thresholdedValues(threshold);
    };
    ChannelStat.prototype.bonferroniCorrectedValues = function (alpha, bothWays) {
        var twoTailed = true;
        if (bothWays !== undefined) {
            twoTailed = bothWays;
        }
        var threshold = this.ppfn(1 - (alpha / ((twoTailed ? 2 : 1) * this.values.length)), 0.0, 1.0);
        return this._thresholdedValues(threshold);
    };
    ChannelStat.prototype.baselineComparisonPValues = function () {
        var _this = this;
        var stat = this;
        var tValues = this.values.map(function (v) {
            if (stat.baseline.variance === undefined)
                return 0.0; // Can't compare against a singular baseline
            var num = v.mean - stat.baseline.mean;
            // Don't include value's variance if it is singular
            var den = Math.sqrt((stat.baseline.variance / stat.baseline.count) +
                ((v.variance === undefined) ? 0.0 : (v.variance / v.count)));
            return num / den;
        });
        return tValues.map(function (t) { return 2.0 * (1.0 - _this.cdfn(Math.abs(t), 0.0, 1.0)); }); // TODO Using asymptotic normal theory; should allow non-asymptotic case
    };
    ChannelStat.prototype.cdfn = function (x, mean, variance) {
        return 0.5 * this.erfc(-(x - mean) / (Math.sqrt(2 * variance)));
    };
    ChannelStat.prototype.argsort = function (arr) {
        var ret = {
            values: [],
            indices: []
        };
        arr.map(function (d, i) { return [d, i]; }).sort(function (left, right) { return left[0] < right[0] ? -1 : 1; }).forEach(function (d) {
            ret.values.push(d[0]);
            ret.indices.push(d[1]);
        });
        return ret;
    };
    ChannelStat.prototype.fdrCorrectedValues = function (fdr) {
        // Compute p-values
        var pValues = this.baselineComparisonPValues();
        // Sort p-values
        var sortResult = this.argsort(pValues);
        // Determine the critical sort index k
        var kGood = -1;
        var nTests = sortResult.values.length;
        sortResult.values.every(function (p, k) {
            if (p > ((k + 1) / nTests) * fdr)
                return false;
            kGood = k;
            return true;
        });
        // Determine which sorted hypotheses we should reject
        var canReject = pValues.map(function (p) { return false; });
        sortResult.indices.every(function (i, k) {
            // k = index in sort
            if (k > kGood)
                return false;
            canReject[i] = true; // i = original index
            return true;
        });
        // Return the thresholded normalized values
        return this.baselineNormalizedValues().map(function (v, i) { return canReject[i] ? v : 0.0; });
    };
    return ChannelStat;
}());
;
export { Gaussian, ChannelStat };
//# sourceMappingURL=fmstat.js.map