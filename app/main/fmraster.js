// =
//
// fmraster
// Raster display manager for WebFM
//
// =

// REQUIRES
var $ = require( 'jquery' );
var d3 = require( 'd3' );
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

    this.timeScale      = null;


    // Events
    this.oncursormove       = function( newTime ) {};
    this.onselectchannel    = function( newChannel ) {};

    // Cursor
    this.selectedChannel        = null;
    this.cursorSvg              = null;
    this.cursorTime             = null;
    this.cursorLocked           = false;
    this.timeRange              = null;
    // TODO Config
    this.cursorSize = {
        'width':    0,
        'height':   0
    };

    // Charts
    this.chartMin               = 0.0;      // TODO Expose to manager
    this.chartMax               = 7.5;

    // TODO Config
    this.channelHeight          = 15;
    this.channelHeightCutoff    = 14;
    this.chartMargin = {
        top: 100,
        right: 0,
        bottom: 0,
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
        this.setupCharts();
        this.setupCursor();
        this.timeRange = [-1,1]


    },

    setupCursor: function() {

        var raster = this;

        this.cursorSvg = d3.select( this.baseNodeId ).append( 'svg' )
                                                        .attr( 'class', 'fm-cursor-svg' );

        // this.cursorSvg1 = d3.select('#testLineNode').select('.fm-testLineNode').select('.childElsvg').append("svg").attr('class','fm-cursor-svg')

        // TODO Why?
        $( this.baseNodeId ).on( 'click', function( event ) {
            raster._cursorClick( event );
        } );

        this.cursorTime = 0.0;
        this.cursorSvg.append( 'line' )
                        .attr( 'class', 'fm-cursor-line' );
        this.cursorSvg.append( 'line' )
                        .attr( 'class', 'fm-cursor-origin-line' );

        // this.cursorSvg1.append( 'line' )
        //                 .attr( 'class', 'fm-cursor-line' );
        // this.cursorSvg1.append( 'line' )
        //                 .attr( 'class', 'fm-cursor-origin-line' );

        this.updateCursor();

    },

    updateCursor: function( newTime ) {

        if ( newTime !== undefined ) {
            this.cursorTime = newTime;
        }

        var raster = this;

        var width = $( this.baseNodeId ).width();
        var height = $( this.baseNodeId ).height();

        // var lineWidth = $( '.childElsvg' ).width();
        // var lineHeight = $( '.childElsvg').height();

        d3.select( this.baseNodeId )
            .select( '.fm-cursor-svg' )
                .attr( 'width', width )
                .attr( 'height', height );

        // d3.select('#testLineNode').select('.fm-testLineNode').select('.childElsvg')
        //     .select( '.fm-cursor-svg1' )
        //         .attr( 'width', lineWidth )
        //         .attr( 'height', lineHeight );

        if ( !this.timeScale ) {
            // Can't update the rest, because doing so would require the time scale
            return;
        }

        var cursorX = this.timeScale.invert( this.cursorTime );

        d3.select( this.baseNodeId )
            .select( '.fm-cursor-svg' )
            .select( '.fm-cursor-line' )
                .classed( 'fm-cursor-locked', function() {
                    return raster.cursorLocked;
                } )
                .attr( 'x1', cursorX )
                .attr( 'y1', 0 )
                .attr( 'x2', cursorX )
                .attr( 'y2', height );

        var originX = this.timeScale.invert( 0.0 );



        d3.select( this.baseNodeId )
            .select( '.fm-cursor-svg' )
            .select( '.fm-cursor-origin-line' )
                .attr( 'x1', originX )
                .attr( 'y1', 0 )
                .attr( 'x2', originX )
                .attr( 'y2', height );

    },

    _cursorClick: function( event ) {
        this.toggleCursor();
    },

    lockCursor: function() {
        this.cursorLocked = true;
        this.updateCursor();
    },

    unlockCursor: function() {
        this.cursorLocked = false;
        this.updateCursor();
    },

    toggleCursor: function() {

        if ( this.cursorLocked ) {
            this.unlockCursor();
            return;
        }

        this.lockCursor();

    },

    getCursorTime: function() {
        return this.cursorTime;
    },

    _dummyData: function( channels ) {
        return channels.reduce( function( obj, ch ) {
            obj[ch] = [0.0];
            return obj;
        } );
    },

    setupCharts: function() {

        var dataHolder = [];

        if ( !this.displayOrder ) {
            // Can't.
            return;
        }

        if ( !this.data ) {
            // Create some dummy data
            this.data = this._dummyData( this.displayOrder );
        }
        var allTheData = this.data

        var raster = this;  // Capture this.

        // TODO Error checking
        var height = this.channelHeight * this.data.length;
        var width = $( this.baseNodeId ).width() - this.chartMargin.left - this.chartMargin.right;

        var n = this.data.length;
        var step = width / this.data[0].values.length;


        // Set up x axis time scale with placeholder values
        if ( !this.timeScale ) {
            this.timeScale = d3.scaleLinear()
                                .domain( [0, width] )
                                .range( [0, 1] );
        } else {
            this.updateTimeDomain( [0, width] );
        }

        // Set up horizon chart maker
        var horizonChart = d3.horizonChart();

        // Join horizons to channels
        var horizons = d3.select( this.baseNodeId ).selectAll( '.fm-horizon' )
                            .data( this.data, function( d ) {
                                return d.channel;
                            } );


        var margin = {top: 20, right: 20, bottom: 30, left: 50},
            lineWidth = 600 - margin.left - margin.right,
            lineHeight = 400 - margin.top - margin.bottom;



        var x = d3.scaleLinear().range([0, lineWidth]);
        var y = d3.scaleLinear().range([lineHeight, 0]);

        var svg = d3.select('#testLineNode').select('.fm-testLineNode').append("svg")
            .attr("class","childElsvg")
            .attr("width", lineWidth + margin.left + margin.right)
            .attr("height", lineHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var line = d3.line()
          .x(function(d) { return x(d.xVal); })
          .y(function(d) { return y(d.yVal); })
          .curve(d3.curveNatural)

          var lineGraphData = [];
          var xVals = linspace(this.timeRange[0],this.timeRange[1],allTheData[0].values.length)
          xVals.forEach(function(e){
            lineGraphData.push({
              xVal: e
            })
          })

          lineGraphData.forEach(function(e,i){
            e.yVal = allTheData[8].values[i]
          })


          y.domain([-5,5])
          x.domain(d3.extent(lineGraphData, function(d) { return d.xVal; }));

          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + lineHeight + ")")
              .call(d3.axisBottom(x))

          svg.append("text")
            .attr("transform", "translate("+lineWidth/2 +","+ margin.top*19 + ")")
            .style("text-anchor", "middle")
            .text("Time (s)")

          svg.append("g")
              .attr("class", "y axis")
              .call(d3.axisLeft(y))

          svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (lineHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Value");


          svg.append("path")
              .datum(lineGraphData)
              .attr("class", "line")
              .attr("d", line);

        svg.append("line")
            .attr("stroke", "black")
            .attr("stroke-dasharray", "5,5")
            .attr("x1", 147)
            .attr("y1", 350)
            .attr("x2", 147)
            .attr("y2", 10)
            .attr("transform", "translate(30,0)");

          function linspace(a,b,n) {
              if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
              if(n<2) { return n===1?[a]:[]; }
              var i,ret = Array(n);
              n--;
              for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
              return ret;
          }

        // Prepare a mousemove function for the horizon charts
        var horizonMouseMove = function( event ) {

            var newChannel = d3.select( event.currentTarget ).datum().channel;
            raster.selectChannel( newChannel );

            if ( raster.cursorLocked ) {
                // No need to update cursor, cause it's locked
                return;
            }

            // Compute new time
            var offset = $( this ).offset();
            var cursorX = event.pageX - offset.left;    // Works because this is parent element
            var newTime = raster.timeScale( cursorX );

            // Update cursor rendering, etc etc.
            raster.updateCursor( newTime );

            // Call cursor event
            raster.oncursormove( newTime );

        };

        // And new horizons
        horizons.enter().append( 'div' )
                            .attr( 'class', 'fm-horizon' )
                            .each( function( d, i ) {
                                // Setup jQuery mouse events
                                $( this ).on( 'mousemove', horizonMouseMove );
                            } )
                .merge( horizons )
                            .classed( 'fm-horizon-small', function() {
                                return ( raster.channelHeight <= raster.channelHeightCutoff );
                            } )
                            .each( function( d, i ) {
                                // Call Horizon chart rendering
                                horizonChart.title( d.channel )
                                            .height( raster.channelHeight )
                                            .step( step  )
                                            .extent( [ raster.chartMin, raster.chartMax ] )
                                            .call( this, d.values );
                            } );

        // Add unneeded horizons
        horizons.exit().remove();

    },

    updateTimeDomain: function( newDomain ) {

        if ( !this.timeScale ) {
            return;
        }

        this.timeScale.domain( newDomain );

    },

    updateTimeRange: function( newRange ) {

        if ( !this.timeScale ) {
            // Can't update time extent if scale doesn't yet exist
            return;
        }
        this.timeRange = newRange;

        this.timeScale.range( newRange );

    },

    update: function( newData ) {

        if ( newData !== undefined ) {
            this._updateData( newData );
        }

        // TODO
        this.setupCharts(newData);

        this.updateCursor();

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
    },

    setExtent: function( newExtent ) {
        this.chartMax = newExtent;

    },

    setRowHeight: function( newHeight ) {
        this.channelHeight = newHeight;
    },

    setSelectedChannel: function( newChannel ) {
        this.selectedChannel = newChannel;
    },

    selectChannel: function( newChannel ) {

        if ( newChannel == this.selectedChannel ) {
            return;
        }

        this.setSelectedChannel( newChannel );
        this.onselectchannel( newChannel );

    },

};

// EXPORT MODULE
module.exports = fmraster;

//
