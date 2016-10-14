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

fmonline.OnlineDataSource = function() { 
    
    // For nested functions
    var manager = this;

    // Event callbacks
    this.onproperties       = function( properties ) {};
    this.ontrial            = function( trialData ) {};

    // Connection for interfacing with the BCI2K system
    this._bciConnection = new bci2k.Connection(); 
    this._bciConnection.onconnect = function( event ) {
        manager._bciDidConnect( event );
    };

    // Cached to prevent excess execute calls when true
    this._bciRunning = false;

    // Connection for receiving data from BCI2K
    this._dataConnection = null;

    this.config = {};
    
};

fmonline.OnlineDataSource.prototype = {

    constructor: fmonline.OnlineDataSource,

    connect: function( address ) {

        if ( address === undefined ) {
            address = this.config.sourceAddress;
        }

        if ( this.config.debug ) {
            console.log( 'Connecting to: ' + address );
        }

        // Connect to the main BCI2K system
        this._bciConnection.connect( address );
    },

    loadConfig: function( configURI ) {
        
        var manager = this;     // Cache this for nested functions

        // Wrap $.getJSON in a standard Promise
        return new Promise( function( resolve, reject ) {
            $.getJSON( configURI )
                .done( resolve )
                .fail( function( req, reason, err ) {
                    // TODO Get error message from jquery object
                    reject( 'Could not load online config from ' + configURI + ' : ' + reason );
                } );
        } ).then( function( data ) {
            manager.config = data;
        } );

    },

    _bciDidConnect: function( event ) {
        
        // Capture this for inline functions
        var manager = this;

        if ( this.config.debug ) {
            console.log( 'Connected to BCI2K. Ensuring Running state ...' );
        }

        this.ensureRunning()
            .then( function() {

                if ( manager.config.debug ) {
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
                    if ( manager.config.debug ) {
                        console.log( 'Could not check whether BCI2K is running: Not connected to BCI2K.' );
                    }
                    // Try again later
                    setTimeout( checkRunning, manager.config.checkRunningInterval );
                    return;
                }

                if ( manager.config.debug ) {
                    console.log( 'Executing System State query ...' );
                }

                manager._bciConnection.execute( 'Get System State', function( result ) {

                    if ( manager.config.debug ) {
                        console.log( 'System state: ' + result.output );
                    }

                    if ( result.output.search( 'Running' ) >= 0 ) {
                        // System state includes 'Running', so we're now good to go
                        // Cache this fact to speed subsequent calls
                        manager._bciRunning = true;
                        resolve( true );
                        return;
                    }

                    // Not running; try again later
                    setTimeout( checkRunning, manager.config.checkRunningInterval );

                } );

            };

            setTimeout( checkRunning, manager.config.checkRunningInterval );

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

                // Returned promise resolves to merged "null" properties if system calls fail
                return properties;

            } );

    },

    _connectToData: function() {

        // Capture this for inline functions
        var manager = this;

        this._dataConnection = new bci2k.DataConnection();
        
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
            // TODO A little janky
            var hostParts = manager._bciConnection.address.split( ':' );
            var dataHost = hostParts[0];

            manager._dataConnection.connect( dataHost + ':' + dataPort );

        } );

    }

};


// EXPORT MODULE

module.exports = fmonline;


//