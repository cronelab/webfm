// ======================================================================== //
//
// fmbrain
// Manager for brain visualization
//
// ======================================================================== //


// REQUIRES

var $ = require( 'jquery' );
var d3 = require( 'd3' );


// MODULE OBJECT

var fmbrain = {};


// MAIN CLASS

fmbrain.BrainVisualizer = function( baseNodeId, config) {

    this.baseNodeId         = baseNodeId;
    this.config             = config;
    this.imageData          = null;
    this.sensorGeometry     = null;
    this.selectedChannel    = null;
    this.data               = null;

    this.dotRadiusScale     = null;
    this.dotColorScale      = null;
    this.dotXScale          = null;
    this.dotYScale          = null;

    this.brainSvg           = null;

    this.aspect = null;
    this.size = {
        width: 0,
        height: 0
    };

    // TODO Put these in a config-file
    this.margin = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    };

    this.dotMaxRadius   = 0.040;
    this.dotColors          = ["#313695","#4575b4","#74add1","#abd9e9","#000000","#fee090","#fdae61","#f46d43","#d73027"];

    if(this.config == 'map')
    {
      this.dotMinRadius   = 0.003;        // u (horizontal) units
      this.extent         = 10.0;         // TODO Expose
      this.dotColorsDomain    = [ -9,       -5,       -2,       -0.01,    0.0,      0.01,     2,        5,        9];
    }
    else
    {
      this.dotMinRadius   = 0.006;        // u (horizontal) units
      this.extent               = 600.0;         // TODO Expose
      this.dotColorsDomain                 = [ -450,    -350,     -100,     -30,      0.0,      30,       100,      350,      450 ];
      this.dotPowerThreshold               = [ this.dotColorsDomain[3], this.dotColorsDomain[5] ];
    }


    this.extentBuffer         = 10.0;         // TODO Expose                                                                                             LIVE
    this.extentBufferInfinity = 180.0;        // TODO Expose                                                                                                LIVE
    this.dotColorsDomainBuffer           = [ -5,      -3.5,     -2,       -1,       0.0,      1,        2,        3.5,      5   ];
    this.dotColorsDomainBufferInfinity   = [ -120,    -80,      -50,      -20,       0.0,     20,       50,       80,       120 ];
    this.dotPowerThresholdBuffer         = [ this.dotColorsDomainBuffer[3], this.dotColorsDomainBuffer[5] ];
    this.dotPowerThresholdBufferInfinity = [ this.dotColorsDomainBufferInfinity[3], this.dotColorsDomainBufferInfinity[5] ];
    this.doDotPowerThreshold = true;

};


fmbrain.BrainVisualizer.prototype = {

    constructor: fmbrain.BrainVisualizer,

    _defaultData: function( channels ) {
        // Return a data map giving zeros for each channel
        return channels.reduce( function( obj, ch ) {
            obj[ch] = 0.0;
            return obj;
        }, {} );
    },

    _reformatForDisplay: function( data ) {

        var brain = this;

        // Takes a channel -> value map and turns it into an array of objects
        return Object.keys( data ).filter( function( ch ) {
            if ( Object.keys( brain.sensorGeometry ).indexOf( ch ) < 0 ) {
                // Ignore if the channel isn't in our geometry
                return false;
            }
            if ( brain.sensorGeometry[ch].u === undefined || brain.sensorGeometry[ch].v === undefined ) {
                // Ignore if the provided geometry is unhelpful
                return false;
            }
            // Don't ignore
            return true;
        } ).map( function( ch ) {
            return {
                channel: ch,
                value: data[ch]
            };
        } );

    },

    setupFromDataset: function( dataset ) {
        // TODO Error handling
        this.setup( dataset.metadata.brainImage, dataset.metadata.sensorGeometry );
    },

    _getDimensionsForData: function( data ) {

        return new Promise( function( resolve, reject ) {

            var image = document.createElement( 'img' );

            image.addEventListener( 'load', function() {
                // Proceed to resolution with new dimensions
                resolve( {
                    width: image.width,
                    height: image.height
                } );
                // Remove itself so we don't need to deal with it
                this.remove();
            } );

            // This will trigger the load
            image.src = data;

        } );

    },

    setup: function( imageData, sensorGeometry ) {

        var brain = this;

        // TODO Format checking
        this.imageData = imageData;
        this.sensorGeometry = sensorGeometry;

        this.data = this._defaultData( Object.keys( this.sensorGeometry ) );

        // Width of *brain* from DOM
        this.size.width = $( this.baseNodeId ).width() - ( this.margin.left + this.margin.right );

        // Setup default scale functions
        this.dotXScale = d3.scaleLinear()       // u -> x
                            .domain( [0, 1] )
                            .range( [0, this.size.width] );
        this.dotYScale = d3.scaleLinear()       // v -> y
                            .domain( [0, 1] )
                            .range( [1, 0] );   // Placeholder until logic
                                                // below comes back with a value
        if(this.config=='map')
        {
          this.dotRadiusScale = d3.scaleSqrt()    // data -> u
            .domain( [0, this.extent] )
            .range( [this.dotMinRadius, this.dotMaxRadius] )
            .clamp( true );
        }
        else{
          if ( this.doDotPowerThreshold ) {
            this.dotRadiusScale = d3.scaleSqrt()
              .domain( [this.dotPowerThreshold[1], this.extent] )
              .range( [this.dotMinRadius, this.dotMaxRadius] )
              .clamp( true );
          } else {
            this.dotRadiusScale = d3.scaleSqrt()    // data -> u
              .domain( [0, this.extent] )
              .range( [this.dotMinRadius, this.dotMaxRadius] )
              .clamp( true );
            }
        }

        this.dotColorScale = d3.scaleLinear()
          .domain( this.dotColorsDomain )
          .range( this.dotColors )
          .clamp( true );

        // To get height to work, we're going to need to do some magic.
        this._getDimensionsForData( this.imageData )
          .then( function( dimensions ) {
          // Determine proper aspect ratio from loaded image
            brain.aspect = dimensions.width / dimensions.height;
            // Use new aspect to get size
            brain.autoResize();
            // Call update to get dots
            brain.update();
          } );

        // Base SVG fills entire baseNode when possible.
        this.brainSvg = d3.select( this.baseNodeId ).append( 'svg' )
          .attr( 'class', 'fm-brain-svg' );

        // Group that holds everything
        var g = this.brainSvg.append( 'g' )
          .attr( 'transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')' );

        // Image element for brain
        // TODO Need to set width / height based on imageData?
        g.append( 'image' )
          .attr( 'class', 'fm-brain-image' )
          .attr( 'xlink:href', this.imageData )
          .attr( 'x', '0' )
          .attr( 'y', '0' );

        // Group that holds dots
        g.append( 'g' )
          .attr( 'class', 'fm-brain-dots' );

      },

      _dotFilter: function( d ) {
      // TODO Not a super effective filter ...
        if ( this._dotX( d ) === undefined ) {
          return false;
        }
        return true;
      },

      _dotFill: function( d ) {
        return this.dotColorScale( d.value );
      },

      _dotVisibility: function( d ) {
        if ( d.channel == this.selectedChannel ) {
          return 'visible';
        }
        if( this.config == 'map' ){
          if ( d.value == 0 ) {
              return 'hidden';
          }
          return 'visible';

        }
        else{
          if ( this.doDotPowerThreshold ){
            if ( d.value > this.dotPowerThreshold[0] & d.value < this.dotPowerThreshold[1] ) {
              return 'hidden';
            }
          } else {
              if ( d.value == 0 ) {
                return 'hidden';
              }
            }
          return 'visible';
        }
      },

      _dotX: function( d ) {
        var pos = this.sensorGeometry[ d.channel ];
        // TODO Bad way to handle errors
        if ( isNaN( pos.u ) ) {
          return -this.dotXScale( this.dotMaxRadius );
        }
      return this.dotXScale( pos.u );
      },

      _dotY: function( d ) {
        var pos = this.sensorGeometry[ d.channel ];
        // TODO Bad way to handle errors
        if ( isNaN( pos.u ) ) {
          return -this.dotXScale( this.dotMaxRadius );
        }
        return this.dotYScale( pos.v );
      },

      _dotRadius: function( d ) {
        // TODO Bad way to handle errors
        if ( isNaN( d.value ) ) {
          return this.dotXScale( this.dotRadiusScale( Math.abs( 0.0 ) ) );
        }
        return this.dotXScale( this.dotRadiusScale( Math.abs( d.value ) ) );
      },

      _dotPosition: function( dot ) {
        dot.attr( 'visibility', this._dotVisibility.bind( this ) )
          .attr( 'cx', this._dotX.bind( this ) )
          .attr( 'cy', this._dotY.bind( this ) )
          .attr( 'r', this._dotRadius.bind( this ) );
      },

      _dotOrder: function( a, b ) {
        // Selected channel is always on top
        if ( a.channel == this.selectedChannel ) {
          return +1;
        }
        if ( b.channel == this.SelectedChannel ) {
          return -1;
        }
        // Smaller dots are on top
        return this._dotRadius( b ) - this._dotRadius( a );
      },

      resize: function( width, height ) {
        if ( !this.brainSvg ) {
          // TODO Error?
          return;
        }
        this.size.width = width;
        this.size.height = height;
        // Update scales
        this.dotXScale.range( [0, this.size.width] );
        this.dotYScale.range( [this.size.height, 0] );
        // Update display
        var baseSelection = d3.select( this.baseNodeId );
        baseSelection.select( '.fm-brain-svg' )
          .attr( 'width', this.size.width + this.margin.left + this.margin.right )
          .attr( 'height', this.size.height + this.margin.top + this.margin.bottom );
        baseSelection.select( '.fm-brain-image' )
          .attr( 'width', this.size.width )
          .attr( 'height', this.size.height );
        baseSelection.selectAll( '.fm-brain-dot' )
          .call( this._dotPosition.bind( this ) )
          .sort( this._dotOrder.bind( this ) );
      },

      autoResize: function() {
        if ( !this.aspect ) {
        // Can't determine proper size without aspect ratio
          return;
        }

        // TODO This requires the base node to  be visible because of how
        // jQuery works; so, setup must occur when plot is visible!
        var width = $( this.baseNodeId ).width() - ( this.margin.left + this.margin.right );
        var height = width / this.aspect;

        if ( width <= 0 || height <= 0 ) {
        // We're not visible so stfu and go away
          return;
        }
        this.resize( width, height );
      },

      update: function( newData ) {
        if ( newData !== undefined ) {
          this.data = newData;
        }
        if ( !this.brainSvg ) {
          // TODO Error?
          return;
        }
        var brain = this;

        var num = 128;
        var pad = "000000";


        //Hardcoding for now because life is hard:
        //Assume electrodes match hardware config
        //
        ind = "RAD1"

        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD9);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAD10);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD9);
        gameInstance.SendMessage(ind, "activityChanger", this.data.ROFD10);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RHD9);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD9);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LAD10);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LHD9);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD9);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LMFD10);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LOFD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LOFD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LOFD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LOFD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LOFD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LOFD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LOFD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.LOFD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAID1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAID2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAID3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAID4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAID5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAID6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAID7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RAID8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD9);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RACD10);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD1);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD2);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD3);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD4);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD5);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD6);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD7);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD8);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD9);
        gameInstance.SendMessage(ind, "activityChanger", this.data.RLFD10);


        // for (var i = 1; i <= 128; i++) {
        //   var str = "LTG" + i;
        //   var ind = str.substring(0,3) + pad.substring(0, pad.length - str.length) + str.substring(3,str.length);
        //   if(document.title == "WebFM: Live")
        //   {
        //     if(eval("this.data."+ind) > 20)
        //     {
        //       gameInstance.SendMessage(ind, "activityChanger", eval("this.data."+ind));
        //     }
        //     else
        //     {
        //       gameInstance.SendMessage(ind, "activityChanger", 0);
        //     }
        //   }
        //   else{
        //     gameInstance.SendMessage(ind, "activityChanger", eval("this.data."+ind));
        //   }
        // }


        var brainDots = d3.select( this.baseNodeId ).select( '.fm-brain-dots' ).selectAll( '.fm-brain-dot' )
          .data( this._reformatForDisplay( this.data ), function( d ) {
            return d.channel;
          } );

        brainDots.enter().append( 'circle' )
          .attr( 'class', 'fm-brain-dot' )
          .merge( brainDots )
          .classed( 'fm-brain-dot-selected', function( d ) {
            return d.channel == brain.selectedChannel;
          } )
            .style( 'fill', this._dotFill.bind( this ) )
            .call( this._dotPosition.bind( this ) )
            .sort( this._dotOrder.bind( this ) );

    },

      setSelectedChannel: function( newChannel ) {
        if ( newChannel == this.selectedChannel ) {
          // No update needed
          return;
        }
        // Update internal state
        this.selectedChannel = newChannel;
        // Call graphical update
        this.update();
      }
  };
  // EXPORT MODULE
  module.exports = fmbrain;
