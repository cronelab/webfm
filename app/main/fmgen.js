// =
// 
// fmgen
// Debug data generator for WebFM
//
// =


// REQUIRES

var fmstat = require( './fmstat' );


// MODULE OBJECT

var fmgen = {};


// MEAT

fmgen.GeneratorDataSource = function() {

    this.nTime = 500;

    this.curTrial = 0;
    this.maxTrials = 200;

    this.properties = {
        'channels': this._defaultChannels( 128 )
    };

    // Delays in ms
    this.trialDelay         = 2 * 1000;
    this.propertiesDelay    = 0.5 * 1000;

    this.running = false;

    this.generator = this._defaultGenerator;

    this.onproperties = function( properties ) {};
    this.ontrial = function( trialData ) {};

}

fmgen.GeneratorDataSource.prototype = {
    
    constructor: fmgen.GeneratorDataSource,

    start: function() {
        this.running = true;

        // Include artificial delay for start
        setTimeout( this.makeProperties, this.propertiesDelay );       
        setTimeout( this.makeTrial, this.trialDelay );
    },

    stop: function() {
        this.running = false;
    },

    makeProperties: function() {

        // TODO Make these mutable
        var properties = this.properties;

        // Ensure reasonable defaults
        properties.subjectName  = properties.subjectName    || 'DEMO_SUBJECT';
        properties.taskName     = properties.taskName       || 'DEMO_TASK';
        // channels is specified by default
        properties.valueUnits   = prpoerties.valueUnits     || 1.0;

        // Call user-provided handler
        this.onproperties( properties );

    },

    makeTrial: function() {

        if ( ! this.running ) {
            // We aren't running, so no need to do anything
            return;
        }

        this.curTrial = this.curTrial + 1;

        // Use generator to make trial data
        var trialData = channels.map( function( channel ) { 
            this.generator( channel, this.curTrial );
        } );

        // Pass it on to the user's event handler
        this.ontrial( trialData );

        if ( this.curTrial < this.maxTrials ) {
            // We still have trials to make
            setTimeout( this.makeTrial, this.trialDelay );
        }

    },

    _defaultChannels: function( nChannels ) {
        var channels = [];
        for ( var i = 1; i <= nChannels; i++ ) {
            channels.push( 'chan' + i.toString() );
        }
        return channels;
    },

    _defaultGenerator: function( channel, trial ) {
        var tv = fmstat.linspace( -1, 3, this.nTime );
        var yv = tv.map( fmstat.sin_f( 0.33, tv ) );
        return fmstat.add_v( yv, fmstat.suml_v( 0.5, fmstat.randn_v( yv.length ) ) );
    }

}


// EXPORT MODULE

module.exports = fmgen;


//
