// ======================================================================== //
//
// bciwatch
// Container for BCI2K state watching
//
// ======================================================================== //


// REQUIRES

var bci2k = require( 'bci2k' );

require( 'setimmediate' );                      // Needed to fix promise
                                                // polyfill on non-IE
var Promise = require( 'promise-polyfill' );    // Needed for IE Promise
                                                // support


// MODULE OBJECT

var bciwatch = {};


// HELPERS

function isFunction( f ) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

// Takes an asynchronous function with callback ( err, result ) => () and turns it into a Promise
function promisify( f ) {
    return new Promise( function( resolve, reject ) {
        f( function( err, result ) {
            if ( err ) {
                reject( err );
                return;
            }
            resolve( result );
        } );
    } );
}


// MAIN CLASS

bciwatch.BCI2KWatcher = function() {

    // For nested functions
    var watcher = this;

    // Event callbacks
    this.onstatechange = function( newState ) {};

    // Connection for interfacing with the BCI2K system
    this._bciConnection = new bci2k.Connection();

    this.watching   = false;
    this.state      = 'Not Connected';

    this.config     = {};

}

bciwatch.BCI2KWatcher.prototype = {

    constructor: bciwatch.BCI2KWatcher,

    connect: function( address ) {

        // For nested functions
        var watcher = this;

        if ( address === undefined ) {
            address = this.config.sourceAddress;
        }

        if ( this.config.debug ) {
            console.log( 'Connecting to: ' + address );
        }

        return this._bciConnection.connect( address )
                                    .then( function( event ) {
                                        watcher._bciDidConnect( event );
                                        return event;
                                    } );

    },

    loadConfig: function( configURI ) {

        var watcher = this;     // Cache this for nested functions

        // Wrap $.getJSON in a standard Promise
        return new Promise( function( resolve, reject ) {
            $.getJSON( configURI )
                .done( resolve )
                .fail( function( req, reason, err ) {
                    // TODO Get error message from jquery object
                    reject( 'Could not load watcher config from ' + configURI + ' : ' + reason );
                } );
        } ).then( function( data ) {
            watcher.config = data;
        } );

    },

    _bciDidConnect: function( event ) {

        if ( this.config.debug ) {
            console.log( 'Connected to BCI2K.' );
        }

        this._updateState( 'Connected' );

    },

    _updateState: function( newState ) {
        if ( this.state != newState ) {
            this.state = newState;
            this.onstatechange( this.state );
        }
    },

    _checkState: function() {

        // Capture this for inline functions
        var watcher = this;

        var tryLaterIfWatching = function() {
            if ( watcher.watching ) {
                setTimeout( function() {
                    watcher._checkState();
                }, watcher.config.checkStateInterval );
            }
        };

        if ( ! this._bciConnection.connected() ) {
            // Can't check system state if not connected
            if ( this.config.debug ) {
                console.log( 'Could not check whether BCI2K is running: Not connected to BCI2K.' );
            }
            // Update to Not Connected state
            this._updateState( 'Not Connected' );
            tryLaterIfWatching();
            return;
        }

        // We know we're connected now

        if ( this.config.debug ) {
            console.log( 'Executing System State query ...' );
        }

        this._bciConnection.execute( 'Get System State', function( result ) {
            // Got the state back from BCI2K
            var newState = result.output.trim();
            if ( watcher.config.debug ) {
                console.log( 'System state: ' + newState );
            }
            // Update to new state
            watcher._updateState( newState );
            tryLaterIfWatching();
        } );

    },

    start: function() {

        // Capture this for inline functions
        var watcher = this;

        this.watching = true;

        // Check Now!
        setTimeout( function() {
            watcher._checkState();
        }, 0 );

    },

    stop: function() {

        this.watching = false;

        // This should short-circuit any active state checking.

    },

    getParameter: function( parameter ) {

        // Capture this for inline functions
        var watcher = this;

        // Make promises for system calls to add on dataset properties
        return promisify( function( cb ) {
            watcher._bciConnection.execute( 'Get Parameter ' + parameter, function( result ) {
                // TODO Do I want this for everything?
                // TODO Check for err based on result.exitcode
                cb( null, result.output.trim() );
            } );
        } );

    }

}


// EXPORT MODULE

module.exports = bciwatch;


//
