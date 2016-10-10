// =
//
// fmraster
// Raster display manager for WebFM
//
// =


// REQUIRES

var $ = require( 'jquery' );
var d3 = require( 'd3' );
d3.horizon = require( '../lib/horizon' );

// Promise compatibility
require( 'setimmediate' );
var Promise = require( 'promise-polyfill' );


// MODULE OBJECT

var fmraster = {};


// MAIN CLASS

fmraster.ChannelRaster = function() {
    
    this.baseNodeId = null;   // '#fm'

    this.data = null;

    // Cursor

    this.cursorSvg              = null;
    this.cursorLine             = null;
    this.cursorLineOrigin       = null;
    this.cursorTimescale        = null;
    this.cursorTimescaleBorder  = null;
    this.cursorText             = null;

    this.cursorPosition         = null;
    this.cursorLocked           = false;

    this.cursorSize = {
        'width':    0,
        'height':   0
    };



};

fmraster.ChannelRaster.prototype = {

    constructor: fmraster.ChannelRaster,

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
            this.data = newData
        }

        

    }

};


// EXPORT MODULE

module.exports = fmraster;


//
