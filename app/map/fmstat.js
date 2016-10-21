// ======================================================================== //
//
// fmstat
// Statistical computations for WebFM.
//
// ======================================================================== //


// MODULE OBJECT

var fmstat = {};


// CLASSES

fmstat.Gaussian = function( mu, s2, n ) {

    this.mean       = mu;
    this.variance   = s2;
    this.count      = n;

    this._m2        = undefined;

};

fmstat.Gaussian.prototype = {

    constructor: fmstat.Gaussian,

    ingest: function( datum ) {

        var delta       = ( this.mean === undefined ) ? datum : datum - this.mean;

        // Update count
        this.count      = ( this.count === undefined ) ? 1 : this.count + 1;
        // Update mean
        this.mean       = ( this.mean === undefined ) ? datum : this.mean + delta / this.count;
        // Update moment
        this._m2        = ( this._m2 === undefined ) ? delta * ( datum - this.mean ) : this._m2 + delta * ( datum - this.mean );
        // Update variance
        // TODO Could fail in weird cases still
        this.variance = ( this.count < 2 ) ? undefined : this._m2 / ( this.count - 1 );

    }

};

fmstat.ChannelStat = function() {

    this.baseline = new fmstat.Gaussian();

    this.values = null;

};

fmstat.ChannelStat.prototype = {

    constructor: fmstat.ChannelStat,

    updateBaseline: function( data ) {

        var stat = this;

        // Add each datum to the baseline distribution
        data.forEach( function( d ) {
            stat.baseline.ingest( d );
        } );

    },

    updateValues: function( data ) {

        var stat = this;

        if ( !this.values ) {
            this.values = [];
            // Use geometry of data to construct values
            data.forEach( function( d ) {
                stat.values.push( new fmstat.Gaussian() );
            } );
        }

        data.forEach( function( d, i ) {
            stat.values[i].ingest( d );
        } );

    },

    meanValues: function() {
        return this.values.map( function( v ) {
            return v.mean;
        } );
    },

    baselineNormalizedValues: function() {
        
        var stat = this;

        return this.values.map( function( v ) {
            if ( stat.baseline.variance === undefined ) {
                return v.mean - stat.baseline.mean;
            }
            return ( v.mean - stat.baseline.mean ) / Math.sqrt( stat.baseline.variance );
        } );

    }

};

// METHODS

// fmstat.randn
// Box-Muller standard normal samples

fmstat.randn = function() {
    var u = 1 - Math.random();
    var v = 1 - Math.random();

    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// fmstat.randn_v
// ^ But as a vector

fmstat.randn_v = function( n ) {
    var ret = [];
    for ( i = 0; i < n; i++ ) {
        ret[i] = fmstat.randn();
    }
    return ret;
}

// fmstat.cumsum
// It has a funny name

fmstat.cumsum = function( arr ) {
    var ret = [];
    var cur = 0.0;
    for ( i = 0; i < arr.length; i++ ) {
        cur += arr[i];
        ret[i] = cur;
    }
    return ret;
}

// fmstat.add_v
// Vector addition

fmstat.add_v = function( v1, v2 ) {
    var ret = [];
    for ( i = 0; i < Math.min( v1.length, v2.length ); i++ ) {
        ret[i] = v1[i] + v2[i];
    }
    return ret;
}

// fmstat.smul_v
// Vector scalar multiplication

fmstat.smul_v = function( k, v ) {
    var ret = [];
    for ( i = 0; i < v.length; i++ ) {
        ret[i] = k * v[i];
    }
    return ret;
}

// fmstat.add_m
// Matrix addition

fmstat.add_m = function( m1, m2 ) {
    var ret = [];
    for ( i = 0; i < m1.length; i++ ) {
        ret[i] = [];
        for ( j = 0; j < m1[i].length; j++ ) {
            ret[i][j] = m1[i][j] + m2[i][j];
        }
    }
    return ret;
}

// fmstat.smul_m
// Matrix scalar multiplication

fmstat.smul_m = function( k, m ) {
    var ret = [];
    for ( i = 0; i < m.length; i++ ) {
        ret[i] = [];
        for ( j = 0; j < m[i].length; j++ ) {
            ret[i][j] = k * m[i][j];
        }
    }
    return ret;
}

// fmstat.pmul_m
// Matrix entrywise multiplication

fmstat.pmul_m = function( m1, m2 ) {
    var ret = [];
    for ( i = 0; i < m1.length; i++ ) {
        ret[i] = [];
        for ( j = 0; j < m1[i].length; j++ ) {
            ret[i][j] = m1[i][j] * m2[i][j];
        }
    }
    return ret;
}

// fmstat.linspace
// Linearly interpolated vector

fmstat.linspace = function( a, b, n ) {
    var ret = [];
    var step = (b - a) / (n - 1);
    for ( i = 0; i < n; i ++ ) {
        ret[i] =  a + i * step;
    }
    return ret;
}

// fmstat.zeros
// Zeros

fmstat.zeros = function( r, c ) {
    var ret = [];
    for ( i = 0; i < r; i++ ) {
        ret[i] = [];
        for ( j = 0; j < c; j++ ) {
            ret[i][j] = 0.0;
        }
    }
    return ret;
}

// fmstat.sin_f
// Returns a sine function at a given spatial frequency

fmstat.sin_f = function( f ) {
    return function( t ) {
        return Math.sin( 2 * Math.PI * f * t );
    };
}


// EXPORT MODULE

module.exports = fmstat;


//