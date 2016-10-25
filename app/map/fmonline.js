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

// Returns an array of zeros
function zeroArray( n ) {
    return Array.apply( null, new Array( n ) ).map( Number.prototype.valueOf, 0 );
}

// Important kinds of data:
// Source           - Raw time series
// SpectralOutput   - Spectral features for one sample block
// Connector        - Output of entire processing chain


// MAIN CLASS

fmonline.OnlineDataSource = function() { 
    
    // For nested functions
    var manager = this;

    // Event callbacks
    this.onproperties           = function( properties ) {};

    this.onRawSignal            = function( rawSignal ) {};
    this.onStartTrial           = function() {};
    this.ontrial                = function( trialData ) {};

    this.onSystemStateChange    = function( newState ) {};

    // Connection for interfacing with the BCI2K system
    this._bciConnection = new bci2k.Connection(); 
    this._bciConnection.onconnect = function( event ) {
        manager._bciDidConnect( event );
    };

    // Cached to prevent excess execute calls when true
    this._bciRunning = false;

    this._dataFormatter = new fmonline.DataFormatter();
    this._dataFormatter.onSourceSignal = function( rawSignal ) {
        manager.onRawSignal( rawSignal );
    };
    this._dataFormatter.ontrial = function( trialData ) {
        manager.ontrial( trialData );
    };
    this._dataFormatter.onStartTrial = function() {
        manager.onStartTrial();
    };
    this._dataFormatter.onFeatureProperties = function( properties ) {
        manager.onproperties( properties );
    };

    this.config = {};
    
};

fmonline.OnlineDataSource.prototype = {

    constructor: fmonline.OnlineDataSource,

    connect: function( address ) {

        var manager = this;     // Capture this for nested functions

        if ( address === undefined ) {
            address = this.config.sourceAddress;
        }

        if ( this.config.debug ) {
            console.log( 'Connecting to: ' + address );
        }

        // TODO Incorporate this Promise-based API for connect() elsewhere
        return new Promise( function( resolve, reject ) {

            // Setup callback to resolve promise
            manager._bciConnection.onconnect = function( event ) {
                resolve( event );
            };

            // Connect to the main BCI2K system
            manager._bciConnection.connect( address );

        } ).then( function( event ) {

            manager._bciDidConnect( event );

        } );
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

    getParameter: function( parameter ) {

        var manager = this; // Capture this

        return new Promise( function( resolve, reject ) {
            manager._bciConnection.execute( 'Get Parameter ' + parameter, function( result ) {
                // TODO Error handling
                resolve( result );
            } );
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

        // Tap raw data stream
        this._bciConnection.tap( 'Source', function( dataConnection ) {

            if ( manager.config.debug ) {
                console.log( 'Source tapped.' );
            }
            
            manager._dataFormatter._connectSource( dataConnection );

        }, function( err ) {

            console.log( 'Could not connect to Source: ' + JSON.stringify( err ) );

        } );

        // Tap spectral feature stream
        this._bciConnection.tap( 'SpectralOutput', function( dataConnection ) {

            if ( manager.config.debug ) {
                console.log( 'SpectralOutput tapped.' );
            }

            manager._dataFormatter._connectFeature( dataConnection );

        }, function( err ) {

            console.log( 'Could not connect to SpectralOutput: ' + JSON.stringify( err ) );

        } );

    }

};


// HELPER CLASS

fmonline.DataFormatter = function() {

    // Properties
    this._sourceConnection      = null;
    this._featureConnection     = null;

    // TODO config
    this._precisionTiming       = false;
    this._timingChannel         = 'ainp1';
    this._timingState           = 'StimulusCode';

    this._featureBand           = [70.0, 110.0];
    this._frameWindow           = [-2.0, 5.0];

    this.trialWindow            = [-1.5, 4.5];

    // TODO Magic
    this._featureWindow         = null;

    this._frameBlocks           = null;
    this._trialBlocks           = null;
    this._postTrialBlocks       = null;     // TODO Refactor

    this.sourceChannels         = null;
    this.sourceProperties       = null;
    this.sourceBuffer           = null;
    this.sourceBufferChannels   = null;
    this.sourceBlockNumber      = 0;

    this.featureChannels        = null;
    this.featureProperties      = null;
    this.featureBuffer          = null;
    this.featureBlockNumber     = 0;

    this.previousState          = null;
    this.stateBlockNumber       = 0;

    this.canProcess             = true;

    this.trialEndBlockNumber    = null;

    // Events
    this.onSourceSignal         = function( rawData ) {};
    this.onStartTrial           = function() {};
    this.ontrial                = function( trialData ) {};

    this.onSourceProperties     = function( properties ) {};
    this.onFeatureProperties    = function( properties ) {};

};

fmonline.DataFormatter.prototype = {

    constructor: fmonline.DataFormatter,

    _connectSource: function( dataConnection ) {

        var formatter = this;   // Capture this

        this._sourceConnection = dataConnection;

        this._sourceConnection.onSignalProperties = function( properties ) {
            formatter.sourceProperties      = properties;
            formatter.sourceChannels        = properties.channels;
            
            if ( formatter._precisionTiming ) {

                // Check if timing channel is in the montage
                if ( formatter.sourceChannels.indexOf( formatter._timingChannel ) < 0 ) {
                    console.log( 'Timing channel not detected; falling back to imprecise timing.' );
                    formatter._precisionTiming = false;
                    formatter.sourceBufferChannels = [];
                } else {
                    formatter.sourceBufferChannels = [ formatter._timingChannel ];
                }

            }

            formatter.onSourceProperties( properties );

            formatter._propertiesReceived();
        };

        this._sourceConnection.onGenericSignal = function( genericSignal ) {
            formatter._processSourceSignal( genericSignal );
        };

        this._sourceConnection.onStateFormat = function( format ) {

            // Check if timing state is available
            if ( format[formatter._timingState] === undefined ) {
                console.log( 'WARNING: Desired timing state ' + formatter._timingState + ' was not detected in the state format for Source.' );
            }

        };

        this._sourceConnection.onStateVector = function( stateVector ) {
            formatter._processStateVector( stateVector );
        };

    },

    _connectFeature: function( dataConnection ) {

        var formatter = this;   // Capture this

        this._featureConnection = dataConnection;

        this._featureConnection.onSignalProperties = function( properties ) {
            formatter.featureProperties     = properties;
            formatter.featureChannels       = properties.channels;

            formatter.onFeatureProperties( properties );

            formatter._propertiesReceived();
        };

        this._featureConnection.onGenericSignal = function( genericSignal ) {
            formatter._processFeatureSignal( genericSignal );
        };

    },

    _propertiesReceived: function() {
        // TODO This is dumb and an antipattern and everything is horrible
        if ( this.sourceProperties && this.featureProperties ) {
            this._allPropertiesReceived();
        }
    },

    _allPropertiesReceived: function() {
        this._setupFeatureWindow( );
        this._setupBuffers();
    },

    _setupBuffers: function() {
        
        // Determine number of blocks in the buffer
        // TODO Assumes elementunit in seconds
        var blockLengthSeconds      = this.sourceProperties.numelements * this.sourceProperties.elementunit.gain;
        var windowLengthSeconds     = this._frameWindow[1] - this._frameWindow[0];
        var windowLengthBlocks      = Math.ceil( windowLengthSeconds / blockLengthSeconds );

        // Initialize feature buffer
        this.featureBuffer = this.featureChannels.reduce( function( arr, ch, i ) {
            arr.push( zeroArray( windowLengthBlocks ) );
            return arr;
        }, [] );

        var trialLengthSeconds  = this.trialWindow[1] - this.trialWindow[0];
        this._trialBlocks       = Math.ceil( trialLengthSeconds / blockLengthSeconds );
        this._postTrialBlocks   = Math.ceil( this.trialWindow[1] / blockLengthSeconds );

        // TODO Debug
        console.log( 'Created feature buffer: ' + this.featureChannels.length + ' channels x ' + windowLengthBlocks + ' samples.' );

    },

    _windowForFrequencies: function( fv ) {
        
        // TODO Replace with more nuanced window
        
        // TODO Second to last bin
        return fv.map( function( f, i ) {
            return ( i == fv.length - 2 ) ? 1.0 : 0.0;
        } );

        var formatter = this;

        var isInBand = function( x ) {
            return (formatter._featureBand[0] <= x && x <= formatter._featureBand[1])
        };

        var windowRaw = fv.map( function( f ) {
            return isInBand( f ) ? 1.0 : 0.0;
        } );

        var windowSum = windowRaw.reduce( function( a, b ) { return a + b; } );

        return windowRaw.map( function( w ) {
            return w / windowSum;
        } );

    },

    _setupFeatureWindow: function() {

        var formatter = this;   // Capture this
        var transform = this.featureProperties.elementunit;

        // TODO Assumes elementunit in Hz
        var featureFreqs = this.featureProperties.elements.map( function( e ) {
            return transform.offset + ( e * transform.gain );
        } );

        // Compute the window vector
        this._featureWindow = this._windowForFrequencies( featureFreqs );

    },

    _computeFeature: function( data ) {
        // data is an array of arrays; outer array is over channels, inner array
        // is over feature elements

        // TODO Error checking

        var formatter = this;   // Capture this

        // Map computation over channels
        return data.map( function( dv ) {
            // Window the feature elements
            return dv.reduce( function( acc, el, iel ) {
                return acc + el * formatter._featureWindow[iel];
            }, 0.0 );      
        } );

    },

    _pushFeatureSample: function( sample ) {
        // sample is an array (over channels) of feature values

        // TODO Error checking

        var formatter = this;   // Capture this

        // Shift the buffer for each channel
        this.featureBuffer.forEach( function( fv ) {
            fv.shift();
        } );

        // Push new sample onto each channel
        sample.forEach( function( d, i ) {
            formatter.featureBuffer[i].push( d );
        } );

    },

    _processSourceSignal: function( signal ) {

        if ( !this.canProcess ) {
            console.log( "Received source signal, but can't process it." );
            return;
        }

        this.sourceBlockNumber += 1;

        // TODO Buffer precision timing channels

        // TODO Do more intelligently
        this.onSourceSignal( this._formatSourceData( signal  ));

    },

    _processFeatureSignal: function( signal ) {

        if ( !this.canProcess ) {
            console.log( "Received feature signal, but can't process it." );
            return;
        }

        this.featureBlockNumber += 1;

        var computedFeatures = this._computeFeature( signal );
        this._pushFeatureSample( computedFeatures );

        if ( this.trialEndBlockNumber ) {
            // We're in a trial, so check if we need to send one out
            if ( this.featureBlockNumber >= this.trialEndBlockNumber ) {
                // It's time!
                this._sendTrial();
            }
        }

    },

    _processStateVector: function( state ) {

        var formatter = this;   // Capture this

        if ( !this.canProcess ) {
            console.log( "Received a state signal, but can't process it." );
        }

        this.stateBlockNumber += 1;

        // Look for changes in the timing state
        // TODO Assumes at most one change per sample block
        state[this._timingState].some( function( s ) {
            return formatter._updateTimingState( s );
        } );

    },

    _updateTimingState: function( newState ) {

        // TODO Shitty API nomenclature

        if ( newState == this.previousState ) {
            // Same ol'
            return false;
        }

        // Changed!
        this.previousState = newState;
        this._timingStateChanged( newState );

        return true;

    },

    _timingStateChanged: function( newState ) {

        // TODO Only for StimulusCode
        if ( newState == 0 ) {
            // Not a new trial; continue
            return;
        }

        if ( this.trialEndBlockNumber ) {
            // Got a new trial while still waiting for previous trial to end
            console.log( 'WARNING Received new trial state, but already in a trial. Ignoring.' );
            return;
        }

        // Starting a new trial for real

        this.trialEndBlockNumber = ( this.stateBlockNumber - 1 ) + this._postTrialBlocks;

        this.onStartTrial();

    },

    _sendTrial: function() {

        var formatter = this;

        var deltaBlocks = this.trialEndBlockNumber - this.featureBlockNumber;

        // Map across channels ...
        var trialData = this.featureBuffer.map( function( dv ) { 
            return dv.slice( dv.length - deltaBlocks - formatter._trialBlocks, dv.length - deltaBlocks );
        } );

        this.trialEndBlockNumber = null;

        this.ontrial( this._formatFeatureData( trialData ) );

    },

    _formatFeatureData: function( trialData ) {
        // Convert a channel by time array to an object
        return this.featureChannels.reduce( function( obj, ch, i ) {
            obj[ch] = trialData[i];
            return obj;
        }, {} );
    },

    _formatSourceData: function( sourceData ) {
        // Convert a channel by time array to an object
        return this.sourceChannels.reduce( function( obj, ch, i ) {
            obj[ch] = sourceData[i];
            return obj;
        }, {} );
    }

};


// EXPORT MODULE

module.exports = fmonline;


//