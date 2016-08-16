// bci2k.js
// [...]

define( [ 'jquery', 'window', 'jdataview'],
function( $, window, jDataView ) {

	var BCI2K = {}; // BCI2K || {};

	// BCI2K.DataView
	// Extension to jDataView
	
	BCI2K.DataView = function() {
		jDataView.apply( this, arguments ); // Call jDataView constructor
	};
	BCI2K.DataView.prototype = Object.create( jDataView.prototype );

	BCI2K.DataView.prototype.getNullTermString = function() {
		var val = "";
		while( true ) {
			v = this.getUint8();
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
	// [...]

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
			if( address === undefined )
				address = window.location.host;
			this.address = address;
			this._socket = new WebSocket( "ws://" + address );

			var connection = this;

			this._socket.onopen = function( event ) {
				connection.onconnect( event );
			};

			this._socket.onmessage = function( event ) {
				arr = event.data.split( ' ' );

				var opcode = arr[0];
				var id = arr[1];
				var msg = arr.slice( 2 ).join(' ');
				 
				switch( opcode ) {
					case 'S': // START: Starting to execute command
						if( connection._exec[ id ].onstart )
							connection._exec[ id ].onstart( connection._exec[ id ] );
						break;
					case 'O': // OUTPUT: Received output from command
						connection._exec[ id ].output += msg + ' \n';
						if( connection._exec[ id ].onoutput )
							connection._exec[ id ].onoutput( connection._exec[ id ] );
						break;
					case 'D': // DONE: Done executing command
						connection._exec[ id ].exitcode = parseInt( msg );
						if( connection._exec[ id ].ondone )
							connection._exec[ id ].ondone( connection._exec[ id ] );
						delete connection._exec[ id ];
						break;
				}
			};

			this._socket.onclose = function( event ) {
				connection.ondisconnect( event );
			};
		},

		stream: function( callback ) {
			this.execute( "Get Parameter WSConnectorServer", function( result ) {
				this.dataConnection = new BCI2K.DataConnection();
				this.dataConnection.ondata = callback;
				this.dataConnection.connect( 
					window.location.hostname + ':' +
					result.output.split( ':' )[1]
				);
			} );
		},

		connected: function() {
			return ( this._socket != null && this._socket.readyState == WebSocket.OPEN );
		},

		execute: function( instruction, ondone, onstart, onoutput ) {
			if( this.connected() ) {
				id = ( ++( this._execid ) ).toString();
				this._exec[ id ] = {
					onstart: onstart,
					onoutput: onoutput,
					ondone: ondone, 
					output: "", 
					exitcode: null
				};
				msg = "E " + id + " " + instruction;
				this._socket.send( msg );
			}
		},

		getVersion: function( fn ) {
			this.execute( "Version", function( exec ) {  
				fn( exec.output.split(' ')[1] );
			} );
		},

		showWindow: function() {
			this.execute( "Show Window" );
		},

		hideWindow: function() {
			this.execute( "Hide Window" );
		},

		resetSystem: function() {
			this.execute( "Reset System" );
		},

		setConfig: function( fn ) {
			this.execute( "Set Config", fn );
		},

		start: function() { 
			this.execute( "Start" );
		},

		stop: function() {
			this.execute( "Stop" );
		},

		kill: function() {
			this.execute( "Exit" );
		}
	}

	// BCI2K.DataConnection
	// [...]

	BCI2K.DataConnection = function() {
		this._socket = null;

		this.onconnect = function( event ) {};
		this.ondata = function( data ) {};
		this.onproperties = function( data ) {};
		this.ondisconnect = function( event ) {};

		var connection = this;

		this._genericSignalReader = new FileReader();
		this._genericSignalReader.onload = function( e ) {
			connection._decodeGenericSignal( e.target.result )
		}
	}

	BCI2K.DataConnection.prototype = {

		constructor: BCI2K.DataConnection,

		connect: function( address ) {
			this._socket = new WebSocket( "ws://" + address );

			var connection = this;

			this._socket.onopen = function( event ) {
				connection.onconnect( event );
			};

			this._socket.onmessage = function( event ) {
				if( typeof( event.data ) == "string" )
					connection._interpretProperties( event.data );
				else connection._genericSignalReader.readAsArrayBuffer( event.data );
			};

			this._socket.onclose = function( event ) {
				connection.ondisconnect( event );
			};
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

		_interpretProperties: function( propstr ) {
			ret = {}
			var props = propstr.split( ' ' );
			var pidx = 0;
			ret.name = props[ pidx++ ];
			pidx++; // '{'

			ret.channels = [];
			while( props[ pidx ] != '}' )
				ret.channels.push( props[ pidx++ ] );
			
			ret.numelements = Number( props[ pidx++ ] );
			ret.signaltype = props[ pidx++ ];

			ret.channelunit = this._decodePhysicalUnits(
				props.slice( pidx, pidx += 5 ).join( ' ' )
			);

			ret.elementunit = this._decodePhysicalUnits(
				props.slice( pidx, pidx += 5 ).join( ' ' )
			);

			pidx++; // '{'

			ret.valueunits = []
			for( var i = 0; i < ret.channels.length; i++ )
				ret.valueunits.push(
					this._decodePhysicalUnits( 
						props.slice( pidx, pidx += 5 ).join( ' ' )
					) 
				);

			pidx++; // '}'
			
			this.onproperties( ret );
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

		_decodeGenericSignal: function( buf ) {
			var dv = new BCI2K.DataView( buf );
			dv._littleEndian = true;

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

			this.ondata( signal );
		},
	}
	
	// Export module
	return BCI2K;

} );