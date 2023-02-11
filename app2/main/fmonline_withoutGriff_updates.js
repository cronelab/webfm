// ======================================================================== //
//
// fmonline
// Container for BCI2K-based online data ingestion
//
// ======================================================================== //


// REQUIRES
var bci2k = require( 'bci2k' );
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
  this.onSourceProperties     = function( properties ) {};
  this.onFeatureProperties    = function( properties ) {};
  // this.onproperties           = function( properties ) {};
  // TODO Only needed to pull out certain properties ...
  this.onBufferCreated        = function() {};

  this.onRawSignal            = function( rawSignal ) {};
  this.onFeatureSignal        = function( featureSignal ) {};
  this.onStartTrial           = function() {};
  this.ontrial                = function( trialData ) {};

  this.onSystemStateChange    = function( newState ) {};

  // Connection for interfacing with the BCI2K system
  this._bciConnection = new bci2k.Connection();

  // Cached to prevent excess execute calls when true
  this._bciRunning = false;

  this.dataFormatter = new fmonline.DataFormatter();
  this.dataFormatter.onBufferCreated = function() {
    manager.onBufferCreated();
  }
  this.dataFormatter.onSourceSignal = function( rawSignal ) {
    manager.onRawSignal( rawSignal );
  };
  this.dataFormatter.onFeatureSignal = function( featureSignal ) {
    manager.onFeatureSignal( featureSignal );
  };
  this.dataFormatter.ontrial = function( trialData ) {
    manager.ontrial( trialData );
  };
  this.dataFormatter.onStartTrial = function() {
    manager.onStartTrial();
  };
  this.dataFormatter.onSourceProperties = function( properties ) {
    manager.onSourceProperties( properties );
  };
  this.dataFormatter.onFeatureProperties = function( properties ) {
    manager.onFeatureProperties( properties );
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

    return this._bciConnection.connect( address )
    .then( function( event ) {
      manager._bciDidConnect( event );
    } );

  },

  setConfig: function( config ) {
    this.config = config;
  },

  // TODO moved JSON loading to app logic, not submodules
  // loadConfig: function( configURI ) {
  //     var manager = this;     // Cache this for nested functions
  //     // Wrap $.getJSON in a standard Promise
  //     return new Promise( function( resolve, reject ) {
  //         $.getJSON( configURI )
  //             .done( resolve )
  //             .fail( function( req, reason, err ) {
  //                 // TODO Get error message from jquery object
  //                 reject( 'Could not load config from ' + configURI + ' : ' + reason );
  //             } );
  //     } ).then( function( data ) {
  //         manager.config = data;
  //     } );
  // },

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

  ensureRunning: function ensureRunning() {

    // Capture this for inline functions
    var manager = this;

    // Returns a promise that resolves if/when BCI2K is running
    return new Promise(function (resolve, reject) {

      if (manager._bciRunning) {
        // We know we're running, so we can resolve without pinging BCI2K
        resolve(true);
        return;
      }
      var executed = true;

      var checkRunning = function checkRunning() {

        if (!manager._bciConnection.connected()) {
          // Can't check system state if not connected
          if (manager.config.debug) {
            console.log('Could not check whether BCI2K is running: Not connected to BCI2K.');
          }
          // Try again later
          setTimeout(checkRunning, manager.config.checkRunningInterval);
          return;
        }

        if (manager.config.debug) {
          // console.log('Executing System State query ...');
        }

        manager._bciConnection.execute('Get System State', function (result) {
          if (manager.config.debug) {
            // console.log('System state: ' + result.output);
          }

          if (result.output.search('Running') >= 0) {
            executed = true;
            resolve(true);

          } else if (result.output.search('Resting') >= 0 && executed == true) {
            executed = false;
            manager._connectToData();
          }

          // Not running; try again later
        });
        setTimeout(checkRunning, manager.config.checkRunningIntervalReconnect);

      };

      setTimeout(checkRunning, manager.config.checkRunningInterval);
    });
  },

  getParameter: function( parameter ) {
    return this._bciConnection.execute( 'Get Parameter ' + parameter );
  },

  getTrialWindow: function() {
    return this.dataFormatter.trialWindow;
  },

  getTrialLength: function() {
    // TODO Private member?
    return this.dataFormatter._trialBlocks;
  },

  _connectToData: function() {

    // Capture this for inline functions
    var manager = this;

    // Tap raw data stream
    this._bciConnection.tap( 'Source' )
    .then( function( dataConnection ) {
      if ( manager.config.debug ) {
        console.log( 'Source tapped.' );
      }
      manager.dataFormatter._connectSource( dataConnection );
    } )
    .catch( function( reason ) {
      console.log( 'Could not connect to Source: ' + reason );
    } );

    // Tap spectral feature stream
    this._bciConnection.tap( 'SpectralOutput' )
    .then( function( dataConnection ) {
      if ( manager.config.debug ) {
        console.log( 'SpectralOutput tapped.' );
      }
      manager.dataFormatter._connectFeature( dataConnection );
    } )
    .catch( function( reason ) {
      console.log( 'Could not connect to SpectralOutput: ' + reason );
    } );

  }

};


// HELPER CLASS

fmonline.DataFormatter = function() {

  // Properties
  this._sourceConnection      = null;
  this._featureConnection     = null;

  // TODO config
  this._stateTiming           = true;
  this._timingChannel         = 'ainp1';
  this._timingState           = ['StimulusCode'];

  this.threshold = {
    offValue: 0.0,
    onValue: 1.0
  };

  this.featureBand = {
    low: 70.0,
    high: 110.0
  };

  this.trialWindow = {
    start: -1.0,
    end: 3.0
  };
  this._bufferPadding         = 0.5;
  this._bufferWindow = {
    start: this.trialWindow.start - this._bufferPadding,
    end: this.trialWindow.end + this._bufferPadding
  };

  // TODO Magic
  this._featureKernel         = null;

  this._frameBlocks           = null;
  this._trialBlocks           = null;
  this._postTrialBlocks       = null;     // TODO Refactor

  this.canProcess             = false;

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

  this.trialEndBlockNumber    = null;


  // Events
  this.onBufferCreated        = function() {};

  this.onSourceSignal         = function( rawData ) {};
  this.onFeatureSignal        = function( featureData ) {};
  this.onStartTrial           = function() {};
  this.ontrial                = function( trialData ) {};

  this.onSourceProperties     = function( properties ) {};
  this.onFeatureProperties    = function( properties ) {};

};

fmonline.DataFormatter.prototype = {

  constructor: fmonline.DataFormatter,

  updateTrialWindow: function( newWindow ) {

    if ( !newWindow ) {
      // No new window provided
      return;
    }

    // Handle new argument values
    if ( newWindow.start !== undefined ) {
      this.trialWindow.start      = newWindow.start;
      this._bufferWindow.start    = newWindow.start - this._bufferPadding;
    }
    if ( newWindow.end !== undefined ) {
      this.trialWindow.end        = newWindow.end;
      this._bufferWindow.end      = newWindow.end + this._bufferPadding;
    }

    // Update everything that depends on the trial and buffer windows
    // TODO We can do this very intelligently with a bunch of time, but
    // for this release we're just going to nuke everything.

    this.trialEndBlockNumber = null;    // Reset trial
    // TODO Nomenclature
    if ( this.canProcess ) {
      this._setupBuffers();               // Make new buffers
    }

  },

  updateFeatureBand: function( newBand ) {

    if ( !newBand ) {
      // No new band provided
      return;
    }

    // Handle new argument values
    if ( newBand.low !== undefined ) {  // 0.0 is a valid value
      this.featureBand.low = newBand.low;
    }
    if ( newBand.high !== undefined ) {
      this.featureBand.high = newBand.high;
    }

    // Update our knowledge depending on the feature band
    this._setupFeatureKernel();

    // TODO Should we zero out the feature buffer?

  },

  updateThreshold: function( newThreshold ) {

    if ( !newThreshold ) {
      // No new threshold provided
      return;
    }

    // Handle new argument values
    if ( newThreshold.offValue !== undefined ) {
      this.threshold.offValue = newThreshold.offValue;
    }
    if ( newThreshold.onValue !== undefined ) {
      this.threshold.onValue = newThreshold.onValue;
    }

    // TODO Anything to update based on this change? ...

  },

  updateTimingMode: function( newMode ) {

    if ( newMode == 'state' ) {
      this._stateTiming = true;
    } else {
      this._stateTiming = false;
    }
  },

  updateTimingChannel: function( newChannel ) {

    if ( !newChannel ) {
      // No new channel provided
      return;
    }

    this._timingChannel = newChannel;

  },
  

  _connectSource: function( dataConnection ) {

    var formatter = this;   // Capture this
    console.log(formatter);
    console.log(dataConnection);

    this._sourceConnection = dataConnection;

    this._sourceConnection.onSignalProperties = function( properties ) {
      formatter.sourceProperties      = properties;
      formatter.sourceChannels        = properties.channels;

      if ( ! formatter._stateTiming ) {

        // Check if timing channel is in the montage
        if ( formatter.sourceChannels.indexOf( formatter._timingChannel ) < 0 ) {
          console.log( 'Timing channel not detected; falling back to imprecise timing.' );
          formatter._stateTiming = true;
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
      formatter._timingState.map(x =>{
        if ( format[x] === undefined ) {
          console.log( 'WARNING: Desired timing state ' + formatter._timingState + ' was not detected in the state format for Source.' );
        }
      })
    };
    // this._sourceConnection.onStateVector = function( stateVector ) {
    //     formatter._processStateVector( stateVector );
    // };
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

    this._featureConnection.onStateVector = function( stateVector ) {
      formatter._processStateVector( stateVector );
    };
  },

  _propertiesReceived: function() {
    // TODO This is dumb and an antipattern and everything is horrible
    if ( this.sourceProperties && this.featureProperties ) {
      this._allPropertiesReceived();
    }
  },

  _allPropertiesReceived: function() {
    this._setupFeatureKernel();
    this._setupBuffers();
  },

  _setupBuffers: function() {

    // Determine number of blocks in the buffer
    // TODO Assumes elementunit in seconds
    var blockLengthSeconds      = this.sourceProperties.numelements * this.sourceProperties.elementunit.gain;
    var windowLengthSeconds     = this._bufferWindow.end - this._bufferWindow.start;
    var windowLengthBlocks      = Math.ceil( windowLengthSeconds / blockLengthSeconds );

    // Initialize feature buffer
    this.featureBuffer = this.featureChannels.reduce( function( arr, ch, i ) {
      arr.push( zeroArray( windowLengthBlocks ) );
      return arr;
    }, [] );

    this.sourceBuffer = this.sourceChannels.reduce(function( arr, ch, i ) {
      arr.push( zeroArray( windowLengthBlocks ) );
      return arr;
    }, [] );

    var trialLengthSeconds  = this.trialWindow.end - this.trialWindow.start;
    this._trialBlocks       = Math.ceil( trialLengthSeconds / blockLengthSeconds );
    this._postTrialBlocks   = Math.ceil( this.trialWindow.end / blockLengthSeconds );

    // TODO Debug
    console.log( 'Created feature buffer: ' + this.featureChannels.length + ' channels x ' + windowLengthBlocks + ' samples.' );

    this.canProcess = true;
    this.onBufferCreated();

  },

  _kernelForFrequencies: function( fv ) {

    // TODO Replace with more nuanced window

    var formatter = this;

    var isInBand = function( x ) {
      return (formatter.featureBand.low <= x && x <= formatter.featureBand.high)
    };

    var windowRaw = fv.map( function( f ) {
      return isInBand( f ) ? 1.0 : 0.0;
    } );

    var windowSum = windowRaw.reduce( function( a, b ) { return a + b; } );

    return windowRaw.map( function( w ) {
      return w / windowSum;
    } );

  },

  _dumbKernel: function( fv ) {

    return fv.map( function( f ) {
      return 1.0 / fv.length;
    } );

  },

  _setupFeatureKernel: function() {

    var formatter = this;   // Capture this
    var transform = this.featureProperties.elementunit;

    // TODO Assumes elementunit in Hz
    var featureFreqs = this.featureProperties.elements.map( function( e ) {
      return transform.offset + ( e * transform.gain );
    } );

    // Compute the window vector
    //this._featureKernel = this._kernelForFrequencies( featureFreqs );
    this._featureKernel = this._dumbKernel( featureFreqs );

  },

  _computeFeature: function( data ) {
    // data is an array of arrays; outer array is over channels, inner array
    // is over feature elements

    if ( !this._featureKernel ) {
      // No feature window, so cannot provide meaningful information
      // TODO Better way to handle errors?
      return data.map( function( dv ) {
        return 0.0;     // TODO Should be undefined, and caller should deal
      } );
    }

    var formatter = this;   // Capture this

    // Map computation over channels
    return data.map( function( dv ) {
      // Window the feature elements
      return dv.reduce( function( acc, el, iel ) {
        return acc + el * formatter._featureKernel[iel];
      }, 0.0 );
    } );

  },

_pushSignalSample: function( sample ) {
  // sample is an array (over channels) of signal values

  // TODO Error checking
  var formatter = this;   // Capture this

  // Shift the buffer for each channel
  this.sourceBuffer.forEach( function( fv ) {
    fv.shift();
  } );

  // Push new sample onto each channel
  sample.forEach( function( d, i ) {
    formatter.sourceBuffer[i].push( d );
  } );

}
,

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

    var formatter = this;   // Capture this
    if ( !this.canProcess ) {
      console.log( "Received source signal, but can't process it." );
      return;
    }

    this.sourceBlockNumber += 1;

    // TODO Buffer precision timing channels
    let average = (array) => array.reduce((a, b) => a + b) / array.length;
    var newArr = []
      signal.forEach(function(e){
        newArr.push(average(e))
      })
// console.log()
    this._pushSignalSample( newArr );

    if ( !this._stateTiming ) {

      // Look for changes in the timing signal
      // TODO Assumes at most one change per sample block
      var timingIndex = this.sourceChannels.indexOf( this._timingChannel );
      signal[timingIndex].some( function( s ) {
        return formatter._updateTimingSignal( s );
      } );

    }

    // TODO Do more intelligently
    this.onSourceSignal( this._formatSourceData( signal ) );

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

    this.onFeatureSignal( this._formatFeatureData( computedFeatures ) );

  },

  _processStateVector: function( state ) {

    var formatter = this;   // Capture this

    if ( !this.canProcess ) {
      console.log( "Received a state signal, but can't process it." );
    }

    this.stateBlockNumber += 1;

    if ( this._stateTiming ) {
      // Look for changes in the timing state
      // TODO Assumes at most one change per sample block
      // console.log(this._timingState);
      this._timingState.map(x=>{
        state[x].some( function( s ) {
          return formatter._updateTimingState( s );
        } );
      })
    }
  },

  _signalThresholdState: function( signalValue ) {
    if ( this.threshold.offValue < this.threshold.onValue ) {
      return ( signalValue >= this.threshold.onValue ) ? 1 : 0;
    }
    return ( signalValue <= this.threshold.onValue ) ? 1 : 0;
  },

  _updateTimingSignal: function( newValue ) {
    // TODO Also shitty API nomenclature
    // Threshold the signal as desired
    var newState = this._signalThresholdState( newValue );
    // Treat the thresholded signal as a timing state
    // TODO More nuanced way?
    return this._updateTimingState( newState );
  },

  _updateTimingState: function( newState ) {
    // TODO Shitty API nomenclature
    if ( newState == this.previousState ) {
      // Same ol'
      return false;
    }

    // Changed!
    // console.log("NEW STATE:   " + newState);
    this.previousState = newState;
    this._timingStateChanged( newState );

    return true;

  },

  _timingStateChanged: function( newState ) {

    // TODO Make more general with parameters
    if ( newState == 0 ) {
        // if (newState == 0 || newState ==4 || newState ==3 || newState ==2 || newState == 1){

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
    // OLD WAY
    // var deltaBlocks = this.trialEndBlockNumber - this.featureBlockNumber;
    // TODO I think this is right, since this is called with this.featureBlockNumber >= this.trialEndBlockNumber
    var deltaBlocks = this.featureBlockNumber - this.trialEndBlockNumber;

    // Map across channels ...
    var trialData = this.featureBuffer.map( function( dv ) {
      return dv.slice( dv.length - deltaBlocks - formatter._trialBlocks, dv.length - deltaBlocks );
    } );
    var signal = this.sourceBuffer.map( function( dv ) {
      return dv.slice( dv.length - deltaBlocks - formatter._trialBlocks, dv.length - deltaBlocks );
    } );

    this.trialEndBlockNumber = null;

    this.ontrial( this._formatFeatureData( trialData ) );
    // this.ontrial( this._formatSourceData( signal ) );

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
