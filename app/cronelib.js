// cronelib.js
// ...

define( function() {

    // MODULE OBJECT

    var cronelib = {};


    // METHODS

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

    return cronelib;

} );