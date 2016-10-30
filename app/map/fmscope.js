// ======================================================================== //
//
// fmscope
// Real-time signal display module for WebFM.
//
// ======================================================================== //


// REQUIRES

var $ = require( 'jquery' );
var d3 = require( 'd3' );

// Promise compatibility
require( 'setimmediate' );
var Promise = require( 'promise-polyfill' );


// MODULE OBJECT

var fmscope = {};


// HELPERS

// Returns an array of zeros
function zeroArray( n ) {
    return Array.apply( null, new Array( n ) ).map( Number.prototype.valueOf, 0 );
}


// MAIN CLASS

fmscope.ChannelScope = function( baseNodeId ) {

    this.baseNodeId     = baseNodeId;

    this.scoping        = false;

    this.channel        = null;
    this.data           = null;
    this.dataExtent     = null;
    this.targetExtent   = null;

    // TODO Config
    this.extentSnap     = 0.25;
    this.windowSamples  = 2500;     // TODO Make this in seconds

    this.plotHeight     = 250;      // TODO Config

    this.plotMargin = {
        left: 30,
        right: 40,
        top: 10,
        bottom: 20
    };

    this.plotSvg        = null;
    this.plotXScale     = null;
    this.plotYScale     = null;

    this.plotLine       = null;
    this.plotXAxis      = null;
    this.plotYAxis      = null;

};

fmscope.ChannelScope.prototype = {

    constructor: fmscope.ChannelScope,

    _setupData: function() {

        this.data           = zeroArray( this.windowSamples );

        if ( !this.channel ) {
            this.dataExtent     = [-100, 100];
            this.targetExtent   = [null, null];
        } else {
            if ( !this.dataExtent ) {
                this.dataExtent     = [-100, 100];
            }
            if ( !this.targetExtent ) {
                this.targetExtent   = [null, null];
            }
        }

        

    },

    autoResize: function() {

        // TODO This requires the base node to  be visible because of how
        // jQuery works; so, setup must occur when plot is visible!
        var width = $( this.baseNodeId ).width() - (this.plotMargin.left + this.plotMargin.right);
        
        // This was a dumb idea; drifts!
        //var height = $( this.baseNodeId ).height() - (this.plotMargin.top + this.plotMargin.bottom);
        var height = this.plotHeight;

        if ( width <= 0 || height <= 0 ) {
            // We're not visible so stfu and go away
            return;
        }

        this._resizePlot( width, height );

    },

    _resizePlot: function( width, height ) {

        this.plotSvg.attr( 'width', width + this.plotMargin.left + this.plotMargin.right )
                    .attr( 'height', height + this.plotMargin.top + this.plotMargin.bottom );

        this.plotXScale.range( [0, width] );
        this.plotYScale.range( [height, 0] );

        d3.select( '.fm-scope-axis-x' )
            .attr( 'transform', 'translate(' + 0 + ',' + height + ')' );

    },

    _setupPlot: function() {

        var scope = this;

        this.plotSvg = d3.select( this.baseNodeId ).append( 'svg' )
                                                    .attr( 'class', 'fm-scope-plot' );

        // TODO Put transform call in _resizePlot?
        var g = this.plotSvg.append( 'g' )
                            .attr( 'transform', 'translate(' + this.plotMargin.left + ',' + this.plotMargin.top + ')' );

        this.plotXScale = d3.scaleLinear()
                                .domain( [0, this.windowSamples - 1] );
        this.plotYScale = d3.scaleLinear()
                                .domain( this.dataExtent );

        this.plotLine = d3.line()
                            .x( function( d, i ) {
                                return scope.plotXScale( i );
                            } )
                            .y( function( d ) {
                                return scope.plotYScale( d );
                            } );

        // Axes

        this.plotXAxis = d3.axisBottom( this.plotXScale );
        this.plotYAxis = d3.axisLeft( this.plotYScale );

        g.append( 'g' )
            .attr( 'class', 'axis fm-scope-axis-x' );

        g.append( 'g' )
            .attr( 'class', 'axis fm-scope-axis-y' );

        // Line
        g.append( 'path' )
            .attr( 'class', 'line fm-scope-line' );

        // Resize it!
        this.autoResize();

    },

    setup: function() {

        // Initialize the data buffer
        this._setupData();

        // Initialize items needed for plotting
        if ( !this.plotSvg ) {
            // TODO Should destroy and re-create plot?
            this._setupPlot();    
        }

        // Do an initial update to display contents
        this.update();

    },

    start: function( newChannel ) {

        if ( newChannel == this.channel ) {
            if ( this.scoping ) {
                // Already scoping this channel, ignore
                return;
            }
        }

        if ( newChannel !== undefined ) {
            this.channel = newChannel;
        } else {
            if ( this.scoping ) {
                // Already scoping this channel implicitly, ignore
                return;
            }
        }

        this.scoping = true;

        // Reset the data buffer
        this._setupData();

        // Update the display to start off
        this.update();

    },

    stop: function() {

        this.scoping = false;

    },

    _updatePlot: function() {

        // Update axes
        var s1 = d3.select( '.fm-scope-axis-x' );
        s1.call( this.plotXAxis );

        d3.select( '.fm-scope-axis-y' )
            .call( this.plotYAxis );

        // Update line

        if ( !this.data ) {
            // Can't update line if we have no data ...
            return;
        }

        d3.select( '.fm-scope-line' )
            .datum( this.data )
            .attr( 'd', this.plotLine );

    },

    update: function( newData ) {

        if ( !this.scoping ) {
            // If we aren't scoping, don't pay attention to updates
            return;
        }

        if ( newData !== undefined ) {
            // Incorporate new data into display buffer
            this._receiveSignal( newData );
        }

        // Update our plot
        this._updatePlot();

    },

    updateProperties: function( properties ) {

        console.log( properties );
        this.properties = properties;

    },

    _pushSamples: function( samples ) {

        var scope = this;

        // For each new sample, pop one sample off the buffer, and push the
        // new sample onto the back
        samples.forEach( function( s ) {
            scope.data.shift();
            scope.data.push( s );
        } );

    },

    _updateScale: function() {

        var dataMin = this.data.reduce( function( acc, d ) {
            return Math.min( acc, d );
        } );
        var dataMax = this.data.reduce( function( acc, d ) {
            return Math.max( acc, d );
        } );

        var targetMin = 0;
        var targetMax = 0;

        if ( !this.targetExtent ) {
            // Target extent is the min and max of the data
            targetMin = dataMin;
            targetMax = dataMax;
        } else {
            targetMin = ( this.targetExtent[0] === null ) ? dataMin : this.targetExtent[0];
            targetMax = ( this.targetExtent[1] === null ) ? dataMax : this.targetExtent[1];
        }

        this.dataExtent[0] = this.dataExtent[0] + this.extentSnap * ( targetMin - this.dataExtent[0] );
        this.dataExtent[1] = this.dataExtent[1] + this.extentSnap * ( targetMax - this.dataExtent[1] );

        // Update our plot to reflect the new extent
        this.plotYScale.domain( this.dataExtent );

    },

    _receiveSignal: function( signal ) {

        if ( !this.scoping ) {
            // We don't care right now
            return;
        }

        if ( !this.channel ) {
            // We can't do anything if we don't know what channel we're
            // scoping
            return;
        }

        if ( Object.keys( signal ).indexOf( this.channel ) < 0 ) {
            // The channel we're looking for isn't in the signal, so again,
            // we can't do anything
            return;
        }

        // We have a channel and it's in the signal, so we can get samples
        // TODO More error checking?
        this._pushSamples( signal[this.channel] );

        // Update our plottiing variables to reflect the new data
        this._updateScale();

    },

    setMinTarget: function( newTarget ) {
        this.targetExtent[0] = newTarget;
    },

    setMaxTarget: function( newTarget ) {
        this.targetExtent[1] = newTarget;
    }

};


// EXPORT MODULE

module.exports = fmscope;


//