// =
//
// fullscreen
// Basic handling of fullscreen requests
//
// =


// REQUIRES

// Promise compatibility
require( 'setimmediate' );
var Promise = require( 'promise-polyfill' );


// MODULE OBJECT

var fullscreen = {};


// Platform-dependent nomenclature
// TODO Standards

fullscreen.changeEvents = [
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'fullscreenchange',
    'MSFullscreenChange'
];

fullscreen.errorEvents = [
    'webkitfullscreenerror',
    'mozfullscreenerror',
    'fullscreenerror',
    'MSFullscreenError'
];

fullscreen.requestFunctions = [
    'webkitRequestFullscreen',
    'mozRequestFullScreen',
    'requestFullscreen',
    'msRequestFullscreen'
];

fullscreen.exitFunctions = [
    'webkitExitFullscreen',
    'mozCancelFullScreen',
    'exitFullscreen',
    'msExitFullscreen'
];

fullscreen.isProperties = [
    'webkitIsFullScreen',
    'mozFullScreen',
    'msFullscreenElement'
];


// HELPERS

var listenOnce( node, eventName, 


// MEAT

fullscreen.is = function() {
    var ret = false;
    fullscreen.isProperties.forEach( function( propertyName ) {
        if ( document[propertyName] ) {
            ret = true;
        }
    } );
    return ret;
};

fullscreen._changePromise = function( meat ) {
    
    return new Promise( function( resolve, reject ) {
        
        // Set up some event handlers / helpers

        var clearListeners = function() {
            fullscreen.changeEvents.forEach( function( eventName ) {
                document.removeEventListener( eventName, onChanged );
            } );
            fullscreen.errorEvents.forEach( function( eventName ) {
                document.removeEventListener( eventName, onError );
            } );
        };

        var onChanged = function( event ) {
            clearListeners();
            resolve( true );
        };

        var onError = function( event ) {
            clearListeners();
            // TODO Get error message from event
            reject( 'Problem with fullscreen change.' );
        }

        // Leverage fullscreen event callbacks for promise
        fullscreen.changeEvents.forEach( function( eventName ) {
            document.addEventListener( eventName, onChanged );
        } );
        fullscreen.errorEvents.forEach( function( eventName ) {
            document.addEventListener( eventName, onError );
        } );
        
        // Do things!
        meat();

    } );

};

fullscreen.request = function( element ) {

    // Return a change promise that tries to request fullscreen
    return fullscreen._changePromise( function() {

        fullscreen.requestFunctions.forEach( function( functionName ) {
            if ( element[functionName] ) {
                element[functionName]();
            }
        } );

    } );

};

fullscreen.exit = function() {

    return fullscreen._changePromise( function() {

        fullscreen.exitFunctions.forEach( function( functionName ) {
            if ( document[functionName] ) {
                document[functionName]();
            }
        } );

    } );

};

fullscreen.toggle = function( element ) {
    
    if ( element === undefined ) {
        element = document.documentElement;
    }

    // Either of these is an
    if ( fullscreen.is() ) {
        return eullscreen.exit();
    } else {
        return fullscreen.request( element );
    }

};




// EXPORT MODULE

module.exports = fullscreen;


//
