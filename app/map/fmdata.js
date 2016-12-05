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

            } // if ( metadata.montage === undefined )

            // labels

            if ( metadata.labels === undefined ) {
                // TODO Can we infer anything?
                newMetadata.labels = [];
            }


            // == contents

            // Guards

            // If contents has neither values nor stats, then it has nothing
            if ( contents.values === undefined && contents.stats === undefined ) {
                reject( 'Loaded dataset lacks content.' );
                return;
            }


            // All done!
            resolve( {
                'metadata': newMetadata,
                'contents': newContents
            } );

        } );

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

        // TODO Other cases we can infer?

        return false;

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
