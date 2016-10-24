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

    // TODO Config
    this.extentSnap     = 0.15;
    this.windowSamples  = 2000;     // TODO Make this in seconds

    this.plotMargin = {
        left: 40,
        right: 10,
        top: 20,
        bottom: 60
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

        this.data       = zeroArray( this.windowSamples );
        this.dataExtent = [-100, 100];
    },

    _setupPlot: function() {

        var scope = this;

        // Issues with d3 auto-populating w/h
        // var width = baseNode.attr( 'width' );
        // var height = baseNode.attr( 'height' );
        var width = $( this.baseNodeId ).width() - (this.plotMargin.left + this.plotMargin.right);
        var height = $( this.baseNodeId ).height() - (this.plotMargin.top + this.plotMargin.bottom);

        this.plotSvg = d3.select( this.baseNodeId ).append( 'svg' )
                                                    .attr( 'class', 'fm-scope-plot' )
                                                    .attr( 'width', width + this.plotMargin.left + this.plotMargin.right )
                                                    .attr( 'height', height + this.plotMargin.top + this.plotMargin.bottom );

        var g = this.plotSvg.append( 'g' )
                            .attr( 'transform', 'translate(' + this.plotMargin.left + ',' + this.plotMargin.top + ')' );

        this.plotXScale = d3.scaleLinear()
                                .domain( [0, this.windowSamples - 1] )
                                .range( [0, width] );
        this.plotYScale = d3.scaleLinear()
                                .domain( this.dataExtent )
                                .range( [height, 0] );

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
            .attr( 'class', 'axis fm-scope-axis-x' )
            .attr( 'transform', 'translate(' + 0 + ',' + height + ')' );

        g.append( 'g' )
            .attr( 'class', 'axis fm-scope-axis-y' );

        // Line
        g.append( 'path' )
            .attr( 'class', 'line fm-scope-line' );

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

        console.log( 'Updating scope with new data.' );

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

        // Extent is a running min / max of the data as long as we're scoping
        var dataMin = this.data.reduce( function( acc, d ) {
            return Math.min( acc, d );
        } );
        var dataMax = this.data.reduce( function( acc, d ) {
            return Math.max( acc, d );
        } );

        this.dataExtent[0] = this.dataExtent[0] + this.extentSnap * ( dataMin - this.dataExtent[0] );
        this.dataExtent[1] = this.dataExtent[1] + this.extentSnap * ( dataMax - this.dataExtent[1] );

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

    }

};


// EXPORT MODULE

module.exports = fmscope;


//