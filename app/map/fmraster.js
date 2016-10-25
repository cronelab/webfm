// =
//
// fmraster
// Raster display manager for WebFM
//
// =


// REQUIRES

var $ = require( 'jquery' );
var d3 = require( 'd3' );
//d3.horizon = require( '../lib/horizon' );
//d3.horizonChart = require( 'd3-horizon-chart' ).horizonChart;
d3.horizonChart = require( '../lib/horizon-chart-custom.js' ).default;

// Promise compatibility
require( 'setimmediate' );
var Promise = require( 'promise-polyfill' );


// MODULE OBJECT

var fmraster = {};


// MAIN CLASS

fmraster.ChannelRaster = function( baseNodeId ) {
    
    this.baseNodeId = baseNodeId;   // e.g., '#fm'

    this.displayOrder   = null;
    this.data           = null;

    // Cursor

    this.cursorSvg              = null;
    this.cursorLine             = null;
    this.cursorLineOrigin       = null;
    this.cursorTimescale        = null;
    this.cursorTimescaleBorder  = null;
    this.cursorText             = null;

    this.cursorPosition         = null;
    this.cursorLocked           = false;

    // TODO Config
    this.cursorSize = {
        'width':    0,
        'height':   0
    };


    // Charts

    this.chartSvg               = null;
    this.chartXScale            = null;
    this.chartYScale            = null;
    this.chartColorScale        = null;

    this.chartMin               = 0.0;      // TODO Expose to manager
    this.chartMax               = 10.0;

    // TODO Config
    this.channelHeight          = 15;
    this.chartMargin = {
        top: 100,
        right: 0,
        bottom: 37,
        left: 0
    };
    this.rangeColors = [
        "#313695",
        "#4575b4",
        "#74add1",
        "#abd9e9",
        "#ffffff",
        "#fee090",
        "#fdae61",
        "#f46d43",
        "#d73027"
    ];
    // this.rangeColors = ["#313695", "#ffffff", "#d73027"];

};

fmraster.ChannelRaster.prototype = {

    constructor: fmraster.ChannelRaster,

    setup: function() {

        if ( !this.displayOrder ) {
            console.log( 'Cannot setup ChannelRaster without display order.' );
            return;
        }

        this.setupCursor();
        this.setupCharts();
    },

    setupCursor: function() {

        // TODO Put style calls into the CSS, not the JS
        this.cursorSvg = d3.select( this.baseNodeId ).append( 'svg' )
                                                        .attr( 'class', 'cursor-svg' )
                                                        .style( 'position', 'fixed' )
                                                        .style( 'z-index', '100' )
                                                        .style( 'pointer-events', 'none' )
                                                        .attr( 'width', this.cursorSize.width )
                                                        .attr( 'height', this.cursorSize.height );

        // ...

    },

    setupCharts: function() {

        if ( !this.data ) {
            console.log( 'WARNING Cannot setup charts without data.' );
            return;
        }

        var raster = this;  // Capture this.

        // TODO Error checking
        var height = this.channelHeight * this.data.length;
        var width = $( this.baseNodeId ).width() - this.chartMargin.left - this.chartMargin.right;
        
        var n = this.data.length;
        var step = width / this.data[0].values.length;

        // Set up horizon chart maker
        var horizonChart = d3.horizonChart();

        // Join horizons to channels
        var horizons = d3.select( this.baseNodeId ).selectAll( '.fm-horizon' )
                            .data( this.data, function( d ) {
                                return d.channel;
                            } );

        // And new horizons
        horizons.enter().append( 'div' )
                            .attr( 'class', 'fm-horizon' )
                            .style( 'margin-bottom', function( d, i ) { // TODO Shitty.
                                return ( i < n - 1 ) ? '0px' : '40px';
                            } )
                .merge( horizons )
                        .each( function( d, i ) {
                            horizonChart.title( d.channel )
                                        .height( raster.channelHeight )
                                        .step( step  )
                                        .extent( [ raster.chartMin, raster.chartMax ] )
                                        .call( this, d.values );
                        } );

        // Add unneeded horizons
        horizons.exit().remove();

    },

    updateCursorSize: function( newSize ) {
        // TODO Should this be supported behavior?
        if ( newSize === undefined ) {
            newSize = {
                'width':    baseNode.width(),
                'height':   baseNode.height()
            };
        }
        // TODO Error checking
        cursorSize = newSize;
    },

    update: function( newData ) {
    
        if ( newData !== undefined ) {
            this._updateData( newData );
        }

        // TODO
        this.setupCharts();

    },

    _updateData: function( newData ) {
        // TODO Error checking
        this.data = this._reformatData( newData );
    },

    _reformatData: function( data ) {
        // Data passed in is a String -> Array dict.
        // Reformat to array of named pairs in display order.
        return this.displayOrder.map( function( ch ) {
            // TODO Error checking
            return {
                channel: ch,
                values: data[ch]
            };
        } );
    },

    setDisplayOrder: function( newDisplayOrder ) {
        // Change instance value
        this.displayOrder = newDisplayOrder;

        if ( !this.data ) {
            // If we don't have data, don't need to update it
            return;
        }

        // Update data to reflect new order
        
        // Turn the data into a dict
        var dictData = this.data.reduce( function( obj, x ) {
            obj[x.channel] = x.values;
            return obj;
        }, {} );

        // Compute the new data with the updated display order
        this._updateData( dictData );
    }

};


// EXPORT MODULE

module.exports = fmraster;


//