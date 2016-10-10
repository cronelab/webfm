// ======================================================================== //
//
// fmonline
// Container for BCI2K-based online data ingestion
//
// ======================================================================== //


// REQUIRES

var bci2k = require( '../lib/bci2k' );

require( 'setimmediate' );                      // Needed to fix promise
                                                // polyfill on non-IE
var Promise = require( 'promise-polyfill' );    // Needed for IE Promise
                                                // support


// SETUP

var bciConnection = new bci2k.Connection();
var dataConnection = null;


// MODULE OBJECT

var fmonline = {};


// HELPERS

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

fmonline.OnlineManager = function() { 
    
    // Event callbacks
    this.onproperties       = function( properties ) {};
    this.ontrial            = function( trialData ) {};

    // Connection for interfacing with the BCI2K system
    this._bciConnection = new bci2k.Connection(); 
    this._bciConnection.onconnect = this._bciDidConnect;

    // Cached to prevent excess execute calls when true
    this._bciRunning = false;

    // Connection for receiving data from BCI2K
    this._dataConnection = null;

    this._debug = true;

    // Magic numbers
    this._checkRunningInterval = 200;
    
};

fmonline.OnlineManager.prototype = {

    constructor: fmonline.OnlineManater,

    connect: function() {
        // Connect to the main BCI2K system
        this._bciConnection.connect();
    },

    _bciDidConnect: function( event ) {
        
        // Capture this for inline functions
        var manager = this;

        this.ensureRunning()
            .then( function() {

                if ( manager._debug ) {
                    console.log( 'BCI2K running; connecting to DataConnection ...' );
                }

                manager._connectToData();

            } )
            .catch( function( reason ) {

                console.log( 'Could not ensure BCI2K is running: ' + reason );

            } );

    },

    ensureRunning: function() {

        // Capture this for inline functions
        var manager = this;
        
        // Returns a promise that resolves if/when BCI2K is running
        return new Promise( function( resolve, reject ) {
            
            if ( manager._bciRunning ) {
                // We know we're running, so we can resolve without pinging BCI2K

                resolve( true );
                return;
            }

            var checkRunning = function() {

                if ( ! manager._bciConnection.connected() ) {
                    // Can't check system state if not connected

                    if ( manager._debug ) {
                        console.log( 'Could not check whether BCI2K is running: Not connected to BCI2K.' );
                    }
                    
                    // Try again later
                    setTimeout( checkRunning, manager._checkRunningInterval );
                    return;
                }

                manager._bciConnection.execute( 'Get System State', function( result ) {
                    
                    if ( result.output.search( 'Running' ) >= 0 ) {
                        // System state includes 'Running', so we're now good to go

                        manager._bciRunning = true;     // Cache this fact to speed subsequent calls
                        
                        resolve( true );
                        return;
                    }

                    // Not running; try again later
                    setTimeout( checkRunning, manager._checkRunningInterval );

                } );

            };

            setTimeout( checkRunning, manager._checkRunningInterval );

        } );
    },

    _appendSystemProperties: function( properties ) {
        
        var manager = this;     // Cache this for inline functions

        // Make promises for system calls to add on dataset properties
        var subjectNamePromise = promisify( function( cb ) {
            manager._bciConnection.execute( 'Get Parameter SubjectName', function( result ) {
                cb( null, result );
            } );
        } );

        var dataFilePromise = promisify( function( cb ) {
            manager._bciConnection.execute( 'Get Parameter DataFile', function( result ) {
                cb( null, result );
            } );
        } );

        // Promise the merged properties if all system calls finish
        return Promise.all( [subjectNamePromise, dataFilePromise] )
            .then( function( results ) {

                // Process results and add them to properties
                properties.subjectName = results[0].output.trim();

                // TODO Parse out task name from DataFile
                properties.taskName = results[1].output.trim();

                // Returned promise resolves to the merged properties
                return properties;

            } )
            .catch( function( reason ) {
                
                console.log( 'Could not obtain additional system properties: ' + reason );
                
                // Fill in defaults to avoid undefined's for user
                properties.subjectName = '';
                properties.taskName = '';

                // Returned promise resolves to "merged" properties if system calls fail
                return properties;

            } );

    },

    _connectToData: function() {

        // Capture this for inline functions
        var manager = this;

        this._dataConnection = new BCI2K.DataConnection();
        
        // Set relevant data callbacks
        this._dataConnection.onsignalproperties = function( signalProperties ) {
            manager._appendSystemProperties( signalProperties )
                    .then( manager.onproperties );
        }

        this._dataConnection.ondata = this.ondata;

        // Determine where data connection is located
        this._bciConnection.execute( 'Get Parameter WSSourceServer', function ( result ) {
            
            var resultParts = result.output.trim().split( ':' );
            var dataPort = resultParts[resultParts.length - 1];

            // Safe to assume that data connection is at same host as system
            var hostParts = manager.address.split( ':' );
            var dataHost = hostParts[0];

            manager._dataConnection.connect( dataHost + ':' + dataPort );

        } );

    }

};


// EXPORT MODULE

module.exports = fmonline;


//
