// =
//
// fmdata
// Datasets for WebFM
//
// =


// REQUIRES

var $ = require( 'jquery' );

// Promise compatibility
require( 'setimmediate' );
var Promise = require( 'promise-polyfill' );


// MODULE OBJECT

var fmdata = {};


// DATASET CLASS

fmdata.Dataset = function() {

    this.properties = {};
    this.data = {};

};

fmdata.Dataset.prototype = {

    constructor: fmdata.Dataset,

    load: function( uri ) {

        return new Promise( resolve, reject ) {

            $.getJSON( uri )
                .done( function( data ) {
                    // TODO Handle loaded Dataset
                    resolve( data );
                } )
                .fail( function() {
                    // TODO Get error message from jQuery promise
                    reject( 'Error requesting WebFM file: ' + uri );
                } );

        };

    }

};


// EXPORT MODULE

module.exports = fmdata;


//
