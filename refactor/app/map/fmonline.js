// ======================================================================== //
//
// fmonline
// Container for BCI2K-based online data ingestion
//
// ======================================================================== //


// REQUIRES

var bci2k = require( '../lib/bci2k' );


// SETUP

var bciConnection = new bci2k.Connection();
var dataConnection = null;


// MODULE OBJECT

var fmonline = {};


// MAIN CLASS

fmonline.OnlineManager = function() { 
    
    // Event callbacks
    this.onproperties       = function( properties ) {};
    this.ondata             = function( data ) {};
    this.onsubjectinfo      = function( subjectInfo ) {};

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

        this._waitForRunning()
            .then( function() {

                if ( manager._debug ) {
                    console.log( 'BCI2K running; connecting to DataConnection ...' );
                }

                manager._connectToData();

            } )
            .catch( function( reason ) {

                console.log( 'Could not ensure BCI2K is running: ' + reason );

            } );

    }

    _waitForRunning: function() {

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
    }

    _connectToData: function() {

        // Capture this for inline functions
        var manager = this;

        this._dataConnection = new BCI2K.DataConnection();
        
        // Copy over relevant data callbacks
        this._dataConnection.onproperties = this.onproperties;
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

        // Determine the subject name
        // TODO Seems odd to have this as a whole separate step?
        this._bciConnection.execute( 'Get Parameter SubjectName', function( result ) {
            
            var subjectInfo = {};
            subjectInfo.name = result.output.trim();

            manager.onsubjectinfo( subjectInfo );

        } );

    }

};


// EXPORT MODULE

module.exports = fmonline;


//
