// =
//
// fmbrain
// Manager for brain visualization
//
// =


// REQUIRES

var $ = require( 'jquery' );
var d3 = require( 'd3' );


// MODULE OBJECT

var fmbrain = {};


// MAIN CLASS

fmbrain.BrainVisualizer = function() {

    this.imageData          = null;
    this.sensorGeometry     = null;

    this.baseNode           = null;
    this.brainSvg           = null;
    this.brainImage         = null;

    this.selectedChannel    = null;
    this.data               = null;

    // TODO Possible to handle resizing properly with just CSS?
    this.size = {
        width: 0,
        height: 0
    };
    // TODO Put these in a config-file
    this.margin = {
        top: 10,
        right: 10,
        bottom: 0,
        left: 0
    };
    this.dotMinRadius   = 0.003;      // u (horizontal) units
    this.dotScale       = 0.008;

    // TODO Handle this with CSS for quick style interchange 
    this.dotStrokeInactive      = '#000000';
    this.dotStrokeWidthInactive = 1;
    this.dotStrokeActive        = '#ffff00';
    this.dotStrokeWidthActive   = 3;

    this.dotFillNeutral     = '#ffffff';
    this.dotFillPositive    = '#f46d43';
    this.dotFillNegative    = '#74add1';

    /*
    this.dotColors = [
        "#313695",
        "#4575b4",
        "#74add1",
        "#abd9e9",
        "#fee090",
        "#fdae61",
        "#f46d43",
        "#d73027"
    ];
    */

};

fmbrain.BrainVisualizer.prototype = {

    constructor: fmbrain.BrainVisualizer,

    _defaultData: function() {
        // TODO Return a data array giving zeros for each channel
    },

    setupFromDataset: function( dataset, baseNode ) {
        // TODO Error handling
        this.setup( dataset.metadata.brainImage, dataset.metadata.sensorGeometry, baseNode );
    },

    setup: function( imageData, sensorGeometry, baseNode ) {

        // TODO Format checking
        this.imageData = brainImage;
        this.sensorGeometry = sensorGeometry;

        this.data = this._defaultData();

        // TODO Should substitute this with baseId (need different nodes for d3 and jQuery)
        this.baseNode = baseNode || d3.select( '#brain' );

        // DOMination
        
        // TODO Sizing is somewhat opaque, clean up pls
        this.brainSvg = d3.select( '#brain' ).append( 'svg' )
                            .attr( 'width', this.size.width + this.margin.left + this.margin.right )
                            .attr( 'height', this.size.height + this.margin.top + this.margin.bottom );
        // TODO ???? Transform should be on the element that brainImage is under?
        this.brainSvg.append( 'g' )
                        .attr( 'transform', 'translate(' + this.marginn.left + ',' + this.margin.top + ')' );

        // TODO Could need to set width and height for data URI to work
        this.brainImage = brainSvg.append( 'g' ).append( 'image' )
                                                .attr( 'xlink:href', this.imageData )
                                                .attr( 'x', '0' )
                                                .attr( 'y', '0' );

        this.brainDots = brainSvg.append( 'g' )
                                    .attr( 'class', 'brain-dots' )
                                 .selectAll( '.brain-dot' )
                                    .data( this.data )
                                 .enter()
                                 .append( 'circle' )
                                 .filter( this._dotFilter )     // TODO Necessary?
                                    .attr( 'class', 'dot' )
                                    .style( 'fill', this._dotFill )
                                    .style( 'stroke', this._dotStroke )
                                    .style( 'stroke-width', this._dotStrokeWidth )
                                    .call( this._dotPosition )
                                    .sort( this._dotOrder );

        // Now that we've added everything we need, do an initial update to make everything pretty
        this.update();

    },

    _dotFilter: function( d ) {
        // TODO Not a super effective filter ...
        if ( this._dotX( d ) === undefined ) {
            return false;
        }
        return true;
    },

    _dotFill: function( d ) {
        // TODO Very naive way of coloring based on old d3_horizon_chart API
        if ( d.value == 0.0 ) {
            return this.dotFillNeutral;
        } else if ( d.value > 0.0 ) {
            return this.dotFillPositive;
        }
        return this.dotFillNegative;
    },

    _dotStroke: function( d ) {
        if ( this.selectedChannel == null ) {
            return this.dotStrokeInactive;      // Nothing is active
        }
        if ( d.name == this.selectedChannel ) {
            return this.dotStrokeActive;        // This datum is active
        }
        return this.dotStrokeInactive;          // " " isn't
    },

    _dotStrokeWidth: function( d ) {
        if ( this.selectedChannel == null ) {
            return this.dotStrokeWidthInactive;
        }
        if ( d.name == this.selectedChannel ) {
            return this.dotStrokeWidthActive;
        }
        return this.dotStrokeWidthInactive;
    },

    _dotX: function( d ) {
        var pos = this.sensorGeometry[ d.name ];
        return ( pos ) ? pos.u * this.size.width : undefined;
    }
    _dotY: function( d ) {
        var pos = this.sensorGeometry[ d.name ];
        // TODO Should v-coordinate be reversed like this?
        return ( pos ) ? (1 - pos.v) * this.size.height : undefined;
    }
    _dotRadius: function( d ) {
        return ( this.dotMinRadius + this.dotScale * Math.abs( d.value ) ) * this.size.width;
    },
    _dotPosition: function( dot ) {
        dot.attr( 'cx', this._dotX )
            .attr( 'cy', this._dotY )
            .attr( 'r', this._dotRadius );
    },

    _dotOrder: function( a, b ) {
        // Selected channel is always on top
        if ( a.name == this.selectedChannel ) {
            return +1;
        }
        if ( b.name == this.SelectedChannel ) {
            return -1;
        }

        // Smaller dots are on top
        return this._dotRadius( b ) - this._dotRadius( a );
    },

    updateContainerSize: function( newContainerSize ) {
        if ( newContainerSize === undefined ) {
            // TODO Should this be a supported behavior?
            newContainerSize = {
                'width':    $( '#brain' ).parent().width();
                'height':   $( '#brain' ).parent().width();
            };
        }

        this.size.width = newContainerSize.width - ( this.margin.left + this.margin.right );
        this.size.height = newContainerSize.height - ( this.margin.top + this.margin.bottom );
    },

    update: function( newData ) {

        if ( newData !== undefined ) {
            this.data = newData;
        }
        
        // TODO Update size manually here, or leave to client?

        this.brainSvg.attr( 'width', this.size.width + this.margin.left + this.margin.right )
                        .attr( 'height', this.size.height + this.margin.top + this.margin.bottom );

        this.brainImage.attr( 'width', this.size.width )
                        .attr( 'height', this.size.height );

        this.brainDots.data( this.data )
                        .style( 'fill', this._dotFill )
                        .style( 'stroke', this._dotStroke )
                        .style( 'stroke-width', dotStrokeWidth )
                        .call( dotPosition )
                        .sort( dotOrder );

    }

};


// EXPORT MODULE
module.exports = fmbrain;


//
