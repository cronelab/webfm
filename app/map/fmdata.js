// ======================================================================== //
//
// fmdata
// Datasets for WebFM
//
// ======================================================================== //


// REQUIRES

var $       = require( 'jquery' );

require( 'setimmediate' );                      // Needed to fix promise
                                                // polyfill on non-IE
var Promise = require( 'promise-polyfill' );    // Needed for IE Promise
                                                // support

var cronelib = require( '../lib/cronelib' );
var fmstat = require( './fmstat' );


// MODULE OBJECT

var fmdata = {};


// DATASET CLASS

fmdata.Dataset = function() {

    // What goes in the file
    this.metadata = {};
    this.contents = {};

    // What interfaces with the application
    this._channelStats = {};
    this._displayData = {};

};

fmdata.Dataset.prototype = {

    constructor: fmdata.Dataset,

    _initialize: function( data ) {

        var dataset = this;

        return this._validate( data )
                    .then( function( validatedData ) {
                        dataset.metadata = validatedData.metadata;
                        dataset.contents = validatedData.contents;

                        dataset._setupChannelStats();
                        dataset._setupDisplayData();

                        return dataset;
                    } );

    },

    _validate: function( data ) {

        return new Promise( function( resolve, reject ) {

            // Convenience
            var metadata = data.metadata;
            var contents = data.contents;

            // Make new copies for returning
            // TODO These aren't deep copies; should they be?
            var newMetadata = Object.assign( {}, metadata );
            var newContents = Object.assign( {}, contents );


            // == metadata

            // Guards

            // If metadata has an '_import' attribute, something went wrong
            // with the formation, so we reject
            if ( metadata['_import'] != undefined ) {
                reject( 'Loaded dataset has an "_import" metadata field, and hence is not complete.' );
                return;
            }

            // Same deal with '_export'
            if ( metadata['_export'] != undefined ) {
                reject( 'Loaded dataset has an "_export" metadata field, and hence is not complete.' );
                return;
            }

            // montage

            var montageFromKeys = function( keys ) {
                // TODO Provide a smart ordering from a (possibly unordered)
                // key list

                return keys;
            };

            if ( metadata.montage === undefined ) {

                if ( metadata.sensorGeometry !== undefined ) {

                    // Use the sensorGeometry
                    var geometryKeys = Object.keys( metadata.sensorGeometry );
                    newMetadata.montage = montageFromKeys( geometryKeys );

                } else {
                    // Need to resort to the contents

                    if ( contents.values !== undefined ) {

                        // Use the values
                        var valuesKeys = Object.keys( contents.values );
                        newMetadata.montage = montageFromKeys( valuesKeys );

                    } else {
                        // Need to resort to the stats

                        if ( contents.stats !== undefined ) {

                            if ( contents.stats.estimators !== undefined ) {

                                // Use the first estimator we find, since all
                                // should have the same data arrangement
                                // TODO Check for case when estimators is empty
                                var estimatorKeys = Object.keys( content.stats.estimators );
                                var firstEstimatorKeys = Object.keys( content.stats.estimators[estimatorKeys[0]] );
                                newMetadata.montage = montageFromKeys( firstEstimatorKeys );

                            } else {
                                // Absolutely no way to reconstruct a montage
                                reject( 'Loaded dataset has no information about recording channels.' );
                                return;
                            }

                        } else {
                            // Absolutely no way to reconstruct a montage
                            reject( 'Loaded dataset has no information about recording channels.' );
                            return;
                        }

                    }

                }

            } // endif ( metadata.montage === undefined )

            // labels

            if ( metadata.labels === undefined ) {
                // TODO Can we infer anything?
                newMetadata.labels = [];
            }


            // == contents

            // Guards

            // Contents doesn't have enough
            if ( contents.values === undefined && contents.stats === undefined && contents.trials === undefined ) {
                reject( 'Loaded dataset lacks content.' );
                return;
            }


            // == All done!

            resolve( {
                'metadata': newMetadata,
                'contents': newContents
            } );

        } );

    },

    _setupChannelStats: function() {

        // Capture this
        var dataset = this;

        if ( this.contents.values !== undefined ) {
            // values exists, so we pay no attention to stats
            this._channelStats = undefined;
            return;
        }

        if ( this.contents.stats !== undefined ) {
            // We've got stats without, so let's use them to make our structures

            var stats = this.contents.stats; // convenience

            // Check which distribution we have
            // TODO For now we only support Gaussian :(
            // TODO Error checking

            if ( stats.distribution.toLowerCase() == 'gaussian' ) {

                var channels = Object.keys( stats.estimators.mean );

                channels.forEach( function ( ch ) {

                    // Convenience
                    var mean = stats.estimators.mean[ch];
                    var variance = stats.estimators.variances[ch];
                    var count = stats.estimators.counts[ch];

                    // Wrap the estimators for each time point into

                    if ( this.isTimeseries() ) {

                        // TODO Error checking
                        var baselineMean = stats.baseline.mean[ch];
                        var baselineVariance = stats.baseline.variance[ch];
                        var baselineCount = stats.baseline.count[ch];

                        var statValues = mean.forEach( function( d, i ) {
                            return new fmstat.Gaussian( mean[i], variance[i], count[i] );
                        } );

                        dataset._channelStats[ch] = new fmstat.ChannelStat( {
                            baseline: new fmstat.Gaussian( baselineMean, baselineVariance, baselineCount ),
                            values: statValues
                        } );

                    } else {

                        // TODO ChannelStat overkill for single datum?
                        dataset._channelStats[ch] = new fmstat.ChannelStat( {
                            values: [ new fmstat.Gaussian( mean, variance, count ) ]
                        } );

                    }

                } );

            } else {
                // Unsupported distribution
                this._channelStats = undefined;
            }

            return;

        }

        if ( this.contents.trials !== undefined ) {
            // We've got trials, so populate our stats with them
            // TODO Assumes Gaussian, cause I'm dumb for the time being

            // Convenience
            var trials = this.contents.trials;

            // TODO Error checking
            var channels = Object.keys( trials[0] );

            channels.forEach( function( ch ) {

                var newChannelOpts = {};

                if ( dataset.isTimeseries() ) {
                    newChannelOpts.baselineWindow = dataset.metadata.baselineWindow;
                }

                var newChannel = new fmstat.ChannelStat( newChannelOpts );

                trials.forEach( function( trialData ) {
                    newChannel.ingest( trialData[ch] );
                } );

                dataset._channelStats[ch] = new fmstat.ChannelStat();

            } );

            return;

        }

        // Can't do anything for stats ¯\_(ツ)_/¯
        this._channelStats = undefined;

    },

    _updateDisplayData: function() {

        if ( this.contents.values !== undefined ) {

            // We have values, so just use them for display
            this._displayData = this.contents.values;
            return Promise.resolve();

        }

        if ( this.contents.stats !== undefined ) {
            
            // TODO Make configurable
            return 

        }

    },

    get: function( uri ) {

        var dataset = this;

        // Wrap $.getJSOn in a standardized Promise
        return new Promise( function( resolve, reject ) {
            $.getJSON( uri )
                .done( resolve )
                .fail( function() {
                    // TODO Get error message from jQuery promise
                    reject( 'Error requesting WebFM file: ' + uri );
                } );
        } ).then( function( data ) {    // Once we've got the data, initialize
            dataset._initialize( data );
        } );

    },

    put: function( uri, opts ) {

        // Merge defaults
        var options = {
            import: false
        };
        if ( opts ) {
            Object.assign( options, opts );
        }

        var dataset = this;

        return new Promise( function( resolve, reject ) {

            var dataToSend = {}; // ... Need deep copy

            if ( options.import ) {
                dataToSend.metadata['_import'] = options.import;
            }

            $.ajax( {
                uri: uri,
                method: 'PUT',
                contentType: 'application/json'
            } )
                .done( resolve )
                .fail( function() {
                    reject( 'Error putting WebFM file to: ' + uri );
                } );

        } ).then( function( response ) {

            // TODO handle

        } );

    },

    isTimeseries: function() {

        // If we're marked as being a timeseries, we're a timeseries
        if ( this.metadata.labels.indexOf( 'timeseries' ) >= 0 ) {
            return true;
        }

        var someMember = function( obj ) {
            var ret = null;
            Object.keys( obj ).every( function( k ) {
                ret = obj[k];
                return false;
            } );
            return ret;
        }

        // If we have values, and an individual value entry is an array, we're a timeseries
        if ( this.contents.values !== undefined ) {
            if ( Array.isArray( someMember( this.contents.values ) ) ) {
                return true;
            }
        }

        // Similar condition, but for stats.estimators
        if ( this.contents.stats !== undefined ) {
            if ( this.contents.stats.estimators !== undefined ) {
                var someEstimator = someMember( this.contents.estimators );
                if ( Array.isArray( someMember( someEstimator ) ) ) {
                    return true;
                }
            }
        }

        // TODO Trials?

        return false;

    },

    dataForTime: function( time ) {

        if ( !this.isTimeseries() ) {
            // Slicing by time is undefined for non-timeseries data
            return undefined;
        }

        // TODO Bit of a kludge to get length of first element of an object
        var dataSamples = 0;
        Object.keys( this._displayData ).every( function( ch ) {
            dataSamples = this._displayData[ch].length;
            return false;   // Makes it so we only execute once
        } );

        var dataWindow = {
            start: this.contents.times[0],
            end: this.contents.times[this.contents.times.length - 1];
        };
        var totalTime = dataWindow.end - dataWindow.start;

        var timeIndexFloat = ((time - dataWindow.start) / totalTime) * dataSamples;
        var timeIndex = Math.floor( timeIndexFloat );
        var timeFrac = timeIndexFloat - timeIndex;

        return Object.keys( this._displayData ).reduce( function( obj, ch ) {
            obj[ch] = (1.0 - timeFrac) * this._displayData[ch][timeIndex] + (timeFrac) * this._displayData[ch][timeIndex + 1];
            return obj
        }, {} );

    }

};


// DATABUNDLE CLASS

fmdata.DataBundle = function() {

    // TODO ...

};

fmdata.DataBundle.prototype = {

    constructor: fmdata.DataBundle,

    _initialize: function( data ) {

        // TODO ...

    },

    get: function( uri ) {

        // Wrap $.getJSOn in a standardized Promise
        return new Promise( function( resolve, reject ) {
            $.getJSON( uri )
                .done( resolve )
                .fail( function() {
                    // TODO Get error message from jQuery promise
                    reject( 'Error requesting WebFM bundle: ' + uri );
                } );
        } ).then( this._initialize );

    },

    uriForDataset: function( id ) {

        // TODO Shouldn't this just be part of the server API?
        // ...
        return '/';

    }

    // TODO ...

}


// EXPORT MODULE

module.exports = fmdata;


//
