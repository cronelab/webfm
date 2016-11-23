// ======================================================================== //
//
// bci2k.js
// A javascript connector for BCI2000
//
// ======================================================================== //


// REQUIRES

var jDataView = require( 'jdataview' );

require( 'setimmediate' );                      // Needed to fix promise
                                                // polyfill on non-IE
var Promise = require( 'promise-polyfill' );    // Needed for IE Promise
                                                // support


// MODULE OBJECT

var BCI2K = {};


// MEMBERS

// BCI2K.DataView
// Provides some extra functionality on top of jDataView

BCI2K.DataView = function() {
    jDataView.apply( this, arguments ); // Call jDataView constructor
}
BCI2K.DataView.prototype = Object.create( jDataView.prototype );

BCI2K.DataView.prototype.getNullTermString = function() {
    var val = "";
    while ( this._offset < this.byteLength ) {
        var v = this.getUint8();
        if( v == 0 ) break;
        val += String.fromCharCode( v );
    }
    return val;
}

BCI2K.DataView.prototype.getLengthField = function( n ) {
    var len = 0;
    var extended = false;
    switch( n ) {
        case 1:
            len = this.getUint8();
            extended = len == 0xff;
            break;
        case 2:
            len = this.getUint16();
            extended = len == 0xffff;
            break;
        case 4:
            len = this.getUint32();
            extended = len == 0xffffffff;
            break;
        default:
            console.error( "unsupported" );
            break;
    }

    return extended ? parseInt( this.getNullTermString() ) : len;
}


// BCI2K.Connection
// Manages a WebSocket connection to BCI2000

BCI2K.Connection = function() {

    this.onconnect = function( event ) {};
    this.ondisconnect = function( event ) {};

    this._socket = null;
    this._execid = 0;
    this._exec = {}
}

BCI2K.Connection.prototype = {

    constructor: BCI2K.Connection,

    connect: function( address ) {

        var connection = this;

        return new Promise( function( resolve, reject ) {

            if ( address === undefined )
                // TODO Browser-dependent
                address = window.location.host;
            connection.address = address;

            connection._socket = new WebSocket( 'ws://' + connection.address );

            connection._socket.onerror = function( error ) {
                // This will only execute if we err before connecting, since
                // Promises can only get triggered once
                reject( 'Error connecting to BCI2000 at ' + connection.address );
            }

            connection._socket.onopen = function( event ) {
                connection.onconnect( event );
                resolve( event );
            }

            connection._socket.onclose = function( event ) {
                connection.ondisconnect( event );
            }

            connection._socket.onmessage = function( event ) {
                connection._handleMessageEvent( event );
            }

        } );

    },

    _handleMessageEvent: function( event ) {
        var arr = event.data.split( ' ' );

        var opcode = arr[0];
        var id = arr[1];
        var msg = arr.slice( 2 ).join(' ');
         
        switch( opcode ) {
            case 'S': // START: Starting to execute command
                if( this._exec[ id ].onstart )
                    this._exec[ id ].onstart( this._exec[ id ] );
                break;
            case 'O': // OUTPUT: Received output from command
                this._exec[ id ].output += msg + ' \n';
                if( this._exec[ id ].onoutput )
                    this._exec[ id ].onoutput( this._exec[ id ] );
                break;
            case 'D': // DONE: Done executing command
                this._exec[ id ].exitcode = parseInt( msg );
                if( this._exec[ id ].ondone )
                    this._exec[ id ].ondone( this._exec[ id ] );
                delete this._exec[ id ];
                break;
        }
    },

    tap: function( location, onSuccess, onFailure ) {

        var connection = this;      

        var locationParameter = "WS" + location + "Server";

        return this.execute( 'Get Parameter ' + locationParameter )
                    .then( function( location ) {

                        if ( location.indexOf( 'does not exist' ) >= 0 ) {
                            return Promise.reject( 'Location parameter does not exist' );
                        }

                        if ( location == '' ) {
                            return Promise.reject( 'Location parameter not set' );
                        }

                        var dataConnection = new BCI2K.DataConnection();

                        // TODO We used to "resolve" here, before doiing the 
                        // actual connecting bit, but I think it makes much
                        // more sense to have tap "success" be actually
                        // connecting to the source, rather than just getting
                        // a sensical address

                        // Use our address plus the port from the result
                        return dataConnection.connect( connection.address + ':' + location.split( ':' )[1] )
                                                .then( function( event ) {
                                                    // To keep with our old API, we actually want to wrap the 
                                                    // dataConnection, and not the connection event
                                                    // TODO This means we can't get the connection event!
                                                    return dataConnection;
                                                } );

                    } );

    },

    connected: function() {
        return ( this._socket != null && this._socket.readyState == WebSocket.OPEN );
    },

    execute: function( instruction, ondone, onstart, onoutput ) {

        var connection = this;

        if ( this.connected() ) {

            return new Promise( function( resolve, reject ) {

                var id = ( ++( connection._execid ) ).toString();

                // TODO Properly handle errors from BCI2000
                connection._exec[ id ] = {
                    onstart: onstart,
                    onoutput: onoutput,
                    ondone: function( exec ) {
                        if ( ondone ) {
                            ondone( exec );
                        }
                        resolve( exec.output );     // TODO Should pass whole thing?
                    },
                    output: '',
                    exitcode: null
                };

                var msg = 'E ' + id + ' ' + instruction;
                connection._socket.send( msg );

            } );

        }

        // Cannot execute if not connected
        return Promise.reject( 'Cannot execute instruction: not connected to BCI2000' );

    },

    getVersion: function( fn ) {
        this.execute( "Version", function( exec ) {  
            fn( exec.output.split(' ')[1] );
        } );
    },

    showWindow: function() {
        return this.execute( "Show Window" );
    },

    hideWindow: function() {
        return this.execute( "Hide Window" );
    },

    resetSystem: function() {
        return this.execute( "Reset System" );
    },

    // TODO Is argument necessary now with Promise API?
    setConfig: function( fn ) {
        return this.execute( "Set Config", fn );
    },

    start: function() { 
        return this.execute( "Start" );
    },

    stop: function() {
        return this.execute( "Stop" );
    },

    kill: function() {
        return this.execute( "Exit" );
    }
}

BCI2K.DataConnection = function() {
    this._socket = null;

    this.onconnect = function( event ) {};
    this.onGenericSignal = function( data ) {};
    this.onStateVector = function( data ) {};
    this.onSignalProperties = function( data ) {};
    this.onStateFormat = function( data ) {};
    this.ondisconnect = function( event ) {};

    this.signalProperties = null;
    this.stateFormat = null;
    this.stateVecOrder = null;
}

BCI2K.DataConnection.prototype = {

    constructor: BCI2K.DataConnection,

    connect: function( address ) {

        var connection = this;

        return new Promise( function( resolve, reject ) {

            connection._socket = new WebSocket( "ws://" + address );

            connection._socket.onerror = function( event ) {
                // This will only execute if we err before connecting, since
                // Promises can only get triggered once
                reject( 'Error connecting to data source at ' + connection.address );
            };

            connection._socket.onopen = function( event ) {
                connection.onconnect( event );
                resolve( event );
            };

            connection._socket.onclose = function( event ) {
                connection.ondisconnect( event );
            };

            connection._socket.onmessage = function( event ) {
                connection._handleMessageEvent( event );
            };

        } );
        
    },

    _handleMessageEvent: function( event ) {

        var connection = this;

        var messageInterpreter = new FileReader();
        messageInterpreter.onload = function( e ) {
            connection._decodeMessage( e.target.result );
        };
        messageInterpreter.readAsArrayBuffer( event.data );

    },

    connected: function() {
        return ( this._socket != null && this._socket.readyState == WebSocket.OPEN );
    },

    SignalType: {
        INT16 : 0,
        FLOAT24 : 1,
        FLOAT32 : 2,
        INT32 : 3
    },

    _decodeMessage: function( data ) {

        var dv = new BCI2K.DataView( data, 0, data.byteLength, true );
        var descriptor = dv.getUint8();

        switch ( descriptor ) {

            case 3:
                this._decodeStateFormat( dv ); break;

            case 4:
                var supplement = dv.getUint8();
                switch ( supplement ) {
                    case 1:
                        this._decodeGenericSignal( dv ); break;
                    case 3:
                        this._decodeSignalProperties( dv ); break;
                    default:
                        console.error( "Unsupported Supplement: " + supplement.toString() );
                        break;
                } break;

            case 5:
                this._decodeStateVector( dv ); break;

            default:
                console.error( "Unsupported Descriptor: " + descriptor.toString() ); break;

        }

    },

    _decodePhysicalUnits: function( unitstr ) {
        var units = {};
        var unit = unitstr.split( ' ' );
        var idx = 0;
        units.offset = Number( unit[ idx++ ] );
        units.gain = Number( unit[ idx++ ] );
        units.symbol = unit[ idx++ ];
        units.vmin = Number( unit[ idx++ ] );
        units.vmax = Number( unit[ idx++ ] );
        return units;
    },

    _decodeSignalProperties: function( dv ) {
        var propstr = dv.getNullTermString();

        // Bugfix: There seems to not always be spaces after '{' characters
        propstr = propstr.replace( /{/g, ' { ' );
        propstr = propstr.replace( /}/g, ' } ' ); 

        this.signalProperties = {};
        var prop_tokens = propstr.split( ' ' );
        var props = [];
        for( var i = 0; i < prop_tokens.length; i++ ) {
            if( $.trim( prop_tokens[i] ) == "" ) continue;
            props.push( prop_tokens[i] );
        }

        var pidx = 0;
        this.signalProperties.name = props[ pidx++ ];

        this.signalProperties.channels = [];
        if( props[ pidx ] == '{' ) {
            while( props[ ++pidx ] != '}' )
                this.signalProperties.channels.push( props[ pidx ] );
            pidx++; // }
        } else {
            var numChannels = parseInt( props[ pidx++ ] );
            for( var i = 0; i < numChannels; i++ )
                this.signalProperties.channels.push( ( i + 1 ).toString() );
        } 

        this.signalProperties.elements = [];
        if( props[ pidx ] == '{' ) {
            while( props[ ++pidx ] != '}' )
                this.signalProperties.elements.push( props[ pidx ] );
            pidx++; // }
        } else {
            var numElements = parseInt( props[ pidx++ ] );
            for( var i = 0; i < numElements; i++ )
                this.signalProperties.elements.push( ( i + 1 ).toString() );
        }
        
        // Backward Compatibility
        this.signalProperties.numelements = this.signalProperties.elements.length;
        this.signalProperties.signaltype = props[ pidx++ ];
        this.signalProperties.channelunit = this._decodePhysicalUnits(
            props.slice( pidx, pidx += 5 ).join( ' ' )
        );

        this.signalProperties.elementunit = this._decodePhysicalUnits(
            props.slice( pidx, pidx += 5 ).join( ' ' )
        );

        pidx++; // '{'

        this.signalProperties.valueunits = []
        for( var i = 0; i < this.signalProperties.channels.length; i++ )
            this.signalProperties.valueunits.push(
                this._decodePhysicalUnits( 
                    props.slice( pidx, pidx += 5 ).join( ' ' )
                ) 
            );

        pidx++; // '}'
        
        this.onSignalProperties( this.signalProperties );
    },

    _decodeStateFormat: function( dv ) {
        this.stateFormat = {};
        var formatStr = dv.getNullTermString();

        var lines = formatStr.split( '\n' );
        for( var lineIdx = 0; lineIdx < lines.length; lineIdx++ ){
            if( $.trim( lines[ lineIdx ] ).length == 0 ) continue;
            var stateline = lines[ lineIdx ].split( ' ' );
            var name = stateline[0];
            this.stateFormat[ name ] = {};
            this.stateFormat[ name ].bitWidth = parseInt( stateline[1] );
            this.stateFormat[ name ].defaultValue = parseInt( stateline[2] );
            this.stateFormat[ name ].byteLocation = parseInt( stateline[3] );
            this.stateFormat[ name ].bitLocation = parseInt( stateline[4] );
        }

        var vecOrder = []
        for( var state in this.stateFormat ) {
            var loc = this.stateFormat[ state ].byteLocation * 8;
            loc += this.stateFormat[ state ].bitLocation
            vecOrder.push( [ state, loc ] );
        }

        // Sort by bit location
        vecOrder.sort( function( a, b ) {
            return a[1] < b[1] ? -1 : ( a[1] > b[1] ? 1 : 0 );
        } );

        // Create a list of ( state, bitwidth ) for decoding state vectors
        this.stateVecOrder = [];
        for( var i = 0; i < vecOrder.length; i++ ) {
            var state = vecOrder[i][0]
            this.stateVecOrder.push( [ state, this.stateFormat[ state ].bitWidth ] );
        } 

        this.onStateFormat( this.stateFormat );
    },

    _decodeGenericSignal: function( dv ) {

        var signalType = dv.getUint8();
        var nChannels = dv.getLengthField( 2 );
        var nElements = dv.getLengthField( 2 );

        var signal = [];
        for( var ch = 0; ch < nChannels; ++ch ) {
            signal.push( [] );
            for( var el = 0; el < nElements; ++el ) {
                switch( signalType ) {

                    case this.SignalType.INT16:
                        signal[ ch ].push( dv.getInt16() );
                        break;

                    case this.SignalType.FLOAT32:
                        signal[ ch ].push( dv.getFloat32() );
                        break;

                    case this.SignalType.INT32:
                        signal[ ch ].push( dv.getInt32() );
                        break;

                    case this.SignalType.FLOAT24:
                        // TODO: Currently Unsupported
                        signal[ ch ].push( 0.0 );
                        break;
                }
            }
        }

        this.onGenericSignal( signal );
    },

    _decodeStateVector: function( dv ) {
        if( this.stateVecOrder == null ) return;

        // Currently, states are maximum 32 bit unsigned integers
        // BitLocation 0 refers to the least significant bit of a byte in the packet
        // ByteLocation 0 refers to the first byte in the sequence.
        // Bits must be populated in increasing significance

        var stateVectorLength = parseInt( dv.getNullTermString() );
        var numVectors = parseInt( dv.getNullTermString() );

        var vecOff = dv.tell();

        var states = {};
        for( var state in this.stateFormat )
            states[ state ] = Array( numVectors ).fill( this.stateFormat[ state ].defaultValue ) ;

        for( var vecIdx = 0; vecIdx < numVectors; vecIdx++ ) {
            var vec = dv.getBytes( stateVectorLength, dv.tell(), true, false );
            var bits = [];
            for( var byteIdx = 0; byteIdx < vec.length; byteIdx++ ) {
                bits.push( ( vec[ byteIdx ] & 0x01 ) != 0 ? 1 : 0 );
                bits.push( ( vec[ byteIdx ] & 0x02 ) != 0 ? 1 : 0 );
                bits.push( ( vec[ byteIdx ] & 0x04 ) != 0 ? 1 : 0 );
                bits.push( ( vec[ byteIdx ] & 0x08 ) != 0 ? 1 : 0 );
                bits.push( ( vec[ byteIdx ] & 0x10 ) != 0 ? 1 : 0 );
                bits.push( ( vec[ byteIdx ] & 0x20 ) != 0 ? 1 : 0 );
                bits.push( ( vec[ byteIdx ] & 0x40 ) != 0 ? 1 : 0 );
                bits.push( ( vec[ byteIdx ] & 0x80 ) != 0 ? 1 : 0 );
            }

                for( var stateIdx = 0; stateIdx < this.stateVecOrder.length; stateIdx++ ) {
                var fmt = this.stateFormat[ this.stateVecOrder[ stateIdx ][ 0 ] ];
                var offset = fmt.byteLocation * 8 + fmt.bitLocation;
                var val = 0; var mask = 0x01;
                for( var bIdx = 0; bIdx < fmt.bitWidth; bIdx++ ) {
                    if( bits[ offset + bIdx ] ) val = ( val | mask ) >>> 0;
                    mask = ( mask << 1 ) >>> 0;
                }
                states[ this.stateVecOrder[ stateIdx ][0] ][ vecIdx ] = val;
                }
        }
        this.onStateVector( states );
    },
}


// EXPORT MODULE

module.exports = BCI2K;


//