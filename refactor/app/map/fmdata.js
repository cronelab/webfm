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

    this.metadata = {};
    this.contents = {};

};

fmdata.Dataset.prototype = {

    constructor: fmdata.Dataset,

    _importMetadata: function( uri ) {

        var dataset = this;

        // Wrap $.getJSON in a standard Promise
        return new Promise( function( resolve, reject ) {
            $.getJSON( uri )
                .done( resolve )
                .fail( function() {
                    // TODO Get error out of jquery object
                    reject( 'Error importing metadata file: ' + uri );
                } );
        } ).then( function( data ) {
            // Final metadata is extension of imported data by actual metadata
            // NOTE $.extend is executed in-place on data
            this.metadata = $.extend( data, this.metadata );
        } );

    },

    _executeImports: function( imports ) {

        // Put all kinds imports on the same footing by array-izing them
        imports = [].concat( imports );

        // _ingegrateMetadata gives precedence to what's currently in this.metadata,
        // so just go in reverse order to preserve "later overwrites earlier" order
        imports.reverse();
        
        // Construct and execute the import chain
        return imports.reduce( function( promisedResult, uriNext ) {
            // The next promised import result is constructed from the previous promise
            // by thenning the import of the next metadata URI
            return promisedResult.then( function( result ) {
                dataset._importMetadata( uriNext );
            } );
        }, Promise.resolve() );     // Initialize with the identity promise

    },

    _initialize: function( data ) {
        
        var dataset = this;     // Capture this for nested functions

        // Contents 
        var initContents = function( contents ) {
            return new Promise( function( resolve, reject ) {
                dataset.contents = contents;
                // TODO Format checking
                resolve( contents );
            } );
        };

        // Metadata
        var initMetadata = function( metadata ) {
            return new Promise( function( resolve, reject ) {
                dataset.metadata = metadata;
                // TODO Format checking
                resolve( metadata );
            } ).then( function( result ) {
                if ( result.hasOwnProperty( '_import' ) ) {
                    return dataset._executeImports( result['_import'] );
                }
            } );
        };

        return Promise.all( [
            initContent( data.contents ),
            initMetadata( data.metadata )
        ] );

    },

    get: function( uri ) {

        // Wrap $.getJSOn in a standardized Promise
        return new Promise( function( resolve, reject ) {
            $.getJSON( uri )
                .done( resolve )
                .fail( function() {
                    // TODO Get error message from jQuery promise
                    reject( 'Error requesting WebFM file: ' + uri );
                } );
        } ).then( this._initialize );   // Once we've got the data, initialize

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
