// ======================================================================== //
//
// cronelib
// Miscellaneous utilities.
//
// ======================================================================== //


// REQUIRES

// Promise compatibility
require( 'setimmediate' );
var Promise = require( 'promise-polyfill' );


// MODULE OBJECT

var cronelib = {};


// METHODS

// cronelib.forEachAsync
// Allows breaks in the computation to do other stuff

cronelib.forEachAsync = function( arr, f, config ) {

    // TODO Find a better pattern
    var batchSize = 100;
    var onbatch = function( i, n ) {};

    if ( config ) {
        batchSize = config.batchSize || batchSize;
        onbatch = config.onbatch || onbatch;
    }

    return new Promise( function( resolve, reject ) {

        // TODO Handle errors inside loop with reject

        ( function worker( start ) {

            setTimeout( function() {

                var nextStart = start + batchSize;

                // Execute f on this block
                for ( var i = start; i < nextStart; i++ ) {
                    if ( i >= arr.length ) {
                        // We're done!
                        resolve();
                        return;
                    }
                    // We're not done, so do something
                    f( arr[i], i, arr );
                }

                // Call our callback
                onbatch( nextStart, arr.length );

                // Move on to next block
                worker( nextStart );

            }, 0 );

        } )( 0 );

    } );

};

cronelib.reduceAsync = function( arr, f, a0, config ) {
    
    var initialValue = arr[0];
    var initialIndex = 1;

    if ( a0 !== undefined ) {
        initialValue = a0;
        initialIndex = 0;
    }

    // TODO Find a better pattern
    var batchSize = 100;
    var onbatch = function( i, n ) {};

    if ( config ) {
        batchSize = config.batchSize || batchSize;
        onbatch = config.onbatch || batchSize;
    }

    return new Promise( function( resolve, reject ) {

        // TODO Handle errors inside loop with reject

        ( function worker( start, acc ) {

            setTimeout( function() {

                var nextStart = start + batchSize;

                // Execute f on this block
                for ( var i = start; i < nextStart; i++ ) {
                    if ( i >= arr.length ) {
                        // We're done!
                        resolve( acc );
                        return;
                    }
                    // We're not done, so do something
                    acc = f( acc, arr[i], i, arr );
                }
                
                // Call our callback
                onbatch( nextStart, arr.length );

                // Move on to next block
                worker( nextStart, acc );

            }, 0 );

        } )( initialIndex, initialValue );

    } );

};

cronelib.mapAsync = function( arr, f, config ) {
    // TODO Inefficient?
    return cronelib.reduceAsync( arr, function( acc, x, i,  xs ) {
        acc.push( f( x, i, xs ) );
        return acc;
    }, [], config );
};


// cronelib.parseQuery
// Parses URL queries to objects

cronelib.parseQuery = function( qstr ) {
    var query = {};
    var a = qstr.substr( 1 ).split( '&' );
    for( var i = 0; i < a.length; i++ ) {
        var b = a[ i ].split( '=' );
        query[ decodeURIComponent( b[0] ) ] = decodeURIComponent( b[1] || '' );
    }
    return query;
}

// cronelib.debounce
// For, e.g., preventing excessive resize() calls

cronelib.debounce = function( func , timeout ) {
    var timeoutID , timeout = timeout || 200;
    return function () {
        var scope = this , args = arguments;
        clearTimeout( timeoutID );
        timeoutID = setTimeout( function () {
            func.apply( scope , Array.prototype.slice.call( args ) );
        } , timeout );
    }
}


// EXPORT MODULE

module.exports = cronelib;


//