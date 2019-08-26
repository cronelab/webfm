class Gaussian {
    constructor(mu, s2, n) {
        this.mean = mu;
        this.variance = s2;
        this.count = n;
        this._m2 = (this.count > 1 && this.variance !== undefined) ? this.variance * (this.count - 1) : undefined;

    }

    ingest(datum) {
        var delta = (this.mean === undefined) ? datum : datum - this.mean;
        this.count = (this.count === undefined) ? 1 : this.count + 1;
        this.mean = (this.mean === undefined) ? datum : this.mean + delta / this.count;
        this._m2 = (this._m2 === undefined) ? delta * (datum - this.mean) : this._m2 + delta * (datum - this.mean);
        this.variance = (this.count < 2) ? undefined : this._m2 / (this.count - 1);
    }
};

class ChannelStat {
    constructor(options) {
        if (!options) { // To streamline later code
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
        this.valueTrials.forEach(function (trialData) {
            // To recompute, we just re-ingest all the trials!
            stat.ingest(trialData);
        });
    }
    ingest(data) {
        var baselineData = data.slice(this.baselineWindow.start, this.baselineWindow.end + 1);
        // Compute summary statistics
        this.ingestValues(data);
        this.ingestBaseline(baselineData);
        // Aggregate new trial data
        this.valueTrials.push(data);
    }

    ingestBaseline(data) {

        var stat = this;

        // Add each datum to the baseline distribution
        data.forEach(function (d) {
            stat.baseline.ingest(d);
        });

    }

    ingestValues(data) {

        var stat = this;

        if (!this.values) {
            this.values = [];
            // Use geometry of data to construct values
            data.forEach(function (d) {
                stat.values.push(new Gaussian());
            });
        }

        data.forEach(function (d, i) {
            stat.values[i].ingest(d);
        });

    }

    meanValues() {
        return this.values.map(function (v) {
            return v.mean;
        });
    }

    baselineNormalizedValues() {

        // TODO Wrong form of baseline normalization; should use SEM units?
        // TODO Check limit description in maxcog demo notebook.

        var stat = this;

        return this.values.map(function (v) {
            if (stat.baseline.variance === undefined) {
                return v.mean - stat.baseline.mean;
            }
            return (v.mean - stat.baseline.mean) / Math.sqrt(stat.baseline.variance);
        });

    }

    _thresholdedValues(threshold) {
        return this.baselineNormalizedValues().map(function (v) {
            return (Math.abs(v) > threshold) ? v : 0.0;
        });
    }

    pointwiseCorrectedValues(alpha, bothWays) {
        var twoTailed = true;
        if (bothWays !== undefined) {
            twoTailed = bothWays;
        }
        var threshold = fmstat.ppfn(1 - (alpha / (twoTailed ? 2 : 1)), 0.0, 1.0);

        return this._thresholdedValues(threshold);
    }

    bonferroniCorrectedValues(alpha, bothWays) {
        var twoTailed = true;
        if (bothWays !== undefined) {
            twoTailed = bothWays;
        }
        var threshold = fmstat.ppfn(1 - (alpha / ((twoTailed ? 2 : 1) * this.values.length)), 0.0, 1.0);

        return this._thresholdedValues(threshold);
    }

    baselineComparisonPValues() {
        var stat = this;

        var tValues = this.values.map(function (v) {

            if (stat.baseline.variance === undefined) {
                // Can't compare against a singular baseline
                return 0.0;
            }

            var num = v.mean - stat.baseline.mean;
            // Don't include value's variance if it is singular
            var den = den = Math.sqrt((stat.baseline.variance / stat.baseline.count) +
                ((v.variance === undefined) ? 0.0 : (v.variance / v.count)));

            return num / den;

        });

        // TODO Using asymptotic normal theory; should allow non-asymptotic case
        return tValues.map(function (t) {
            // TODO Support two-tailed
            return 2.0 * (1.0 - fmstat.cdfn(Math.abs(t), 0.0, 1.0));
        });

    }

    fdrCorrectedValues(fdr) {

        // Compute p-values
        var pValues = this.baselineComparisonPValues();

        // Sort p-values
        var sortResult = fmstat.argsort(pValues);

        // Determine the critical sort index k
        var kGood = -1;
        var nTests = sortResult.values.length;
        sortResult.values.every(function (p, k) {
            if (p > ((k + 1) / nTests) * fdr) {
                return false; // Breaks out
            }
            kGood = k;
            return true;
        });

        // Determine which sorted hypotheses we should reject
        var canReject = pValues.map(function (p) {
            return false;
        });
        sortResult.indices.every(function (i, k) {
            if (k > kGood) { // k = index in sort
                return false; // Breaks out
            }
            canReject[i] = true; // i = original index
            return true;
        });

        // Return the thresholded normalized values
        return this.baselineNormalizedValues().map(function (v, i) {
            return canReject[i] ? v : 0.0;
        });

    }



};

// fmstat.cdfn & fmstat.erf courtesy of
// https://github.com/errcw/gaussian
const fmstat = {
    argsort(arr) {

        var zipped = arr.map(function (d, i) {
            return [d, i];
        });

        zipped.sort(function (left, right) {
            return left[0] < right[0] ? -1 : 1;
        });

        var ret = {
            values: [],
            indices: []
        };

        zipped.forEach(function (d) {
            ret.values.push(d[0]);
            ret.indices.push(d[1]);
        });
        return ret;
    },
    ppfn(x, mean, variance) {
        return mean - Math.sqrt(2 * variance) * fmstat.ierfc(2 * x);
    },


    erfc(x) {
        var z = Math.abs(x);
        var t = 1 / (1 + z / 2);
        var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 +
            t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
                t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
                    t * (-0.82215223 + t * 0.17087277)))))))))
        return x >= 0 ? r : 2 - r;
    },
    cdfn(x, mean, variance) {
        return 0.5 * fmstat.erfc(-(x - mean) / (Math.sqrt(2 * variance)));
    },

    ierfc(x) {
        if (x >= 2) {
            return -100;
        }
        if (x <= 0) {
            return 100;
        }

        var xx = (x < 1) ? x : 2 - x;
        var t = Math.sqrt(-2 * Math.log(xx / 2));
        var r = -0.70711 * ((2.30753 + t * 0.27061) / (1 + t * (0.99229 + t * 0.04481)) - t);
        for (var j = 0; j < 2; j++) {
            var err = fmstat.erfc(r) - xx;
            r += err / (1.12837916709551257 * Math.exp(-(r * r)) - r * err);
        }
        return (x < 1) ? r : -r;
    },

    // fmstat.randn
    // Box-Muller standard normal samples

    randn() {
        var u = 1 - Math.random();
        var v = 1 - Math.random();

        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    },

    // fmstat.randn_v
    // ^ But as a vector

    randn_v(n) {
        var ret = [];
        for (i = 0; i < n; i++) {
            ret[i] = randn();
        }
        return ret;
    },

    cumsum(arr) {
        var ret = [];
        var cur = 0.0;
        for (i = 0; i < arr.length; i++) {
            cur += arr[i];
            ret[i] = cur;
        }
        return ret;
    },

    // fmstat.add_v
    // Vector addition

    add_v(v1, v2) {
        var ret = [];
        for (i = 0; i < Math.min(v1.length, v2.length); i++) {
            ret[i] = v1[i] + v2[i];
        }
        return ret;
    },

    // fmstat.smul_v
    // Vector scalar multiplication

    smul_v(k, v) {
        var ret = [];
        for (i = 0; i < v.length; i++) {
            ret[i] = k * v[i];
        }
        return ret;
    },

    // fmstat.add_m
    // Matrix addition

    add_m(m1, m2) {
        var ret = [];
        for (i = 0; i < m1.length; i++) {
            ret[i] = [];
            for (j = 0; j < m1[i].length; j++) {
                ret[i][j] = m1[i][j] + m2[i][j];
            }
        }
        return ret;
    },

    // fmstat.smul_m
    // Matrix scalar multiplication

    smul_m(k, m) {
        var ret = [];
        for (i = 0; i < m.length; i++) {
            ret[i] = [];
            for (j = 0; j < m[i].length; j++) {
                ret[i][j] = k * m[i][j];
            }
        }
        return ret;
    },
    // fmstat.pmul_m
    // Matrix entrywise multiplication

    pmul_m(m1, m2) {
        var ret = [];
        for (i = 0; i < m1.length; i++) {
            ret[i] = [];
            for (j = 0; j < m1[i].length; j++) {
                ret[i][j] = m1[i][j] * m2[i][j];
            }
        }
        return ret;
    },

    // fmstat.linspace
    // Linearly interpolated vector

    linspace(a, b, n) {
        var ret = [];
        var step = (b - a) / (n - 1);
        for (i = 0; i < n; i++) {
            ret[i] = a + i * step;
        }
        return ret;
    },

    // fmstat.zeros
    // Zeros

    zeros(r, c) {
        var ret = [];
        for (i = 0; i < r; i++) {
            ret[i] = [];
            for (j = 0; j < c; j++) {
                ret[i][j] = 0.0;
            }
        }
        return ret;
    },

    // fmstat.sin_f
    // Returns a sine function at a given spatial frequency

    sin_f(f) {
        return function (t) {
            return Math.sin(2 * Math.PI * f * t);
        };
    }
}

module.exports = {
    Gaussian,
    ChannelStat,
    fmstat
};