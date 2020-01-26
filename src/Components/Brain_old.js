import {Image } from 'react-bootstrap';
import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../actions/_actions';
import * as d3 from 'd3';
import $ from 'jquery';
class Brain extends Component {
    constructor(props) {
        super(props);
        this.state = {
            imageHeight: 0,
            imageWidth: 0,
            brainblob: '',
            dotRadiusScale: null,
            dotColorScale: null,
            dotXScale: null,
            dotYScale: null,
            size: {
                width: 0,
                height: 0
            },
            margin: {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            },
            dotMaxRadius: 0.040,
            dotColors: [
              "#313695","#4575b4","#74add1","#abd9e9","#000000","#fee090","#fdae61","#f46d43","#d73027"
            ],
            dotMinRadius: 0.003,
            extent:       10.0,
            dotColorsDomain: [ 
              -9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9
            ],
            extentBuffer: 10.0,
            extentBufferInfinity: 180.0,
            dotColorsDomainBuffer: [ 
              -5, -3.5, -2, -1, 0.0, 1, 2, 3.5, 5   
            ],
            dotColorsDomainBufferInfinity: [
              -120, -80, -50, -20, 0.0, 20, 50, 80, 120
            ],
            dotPowerThresholdBuffer: [ 
              // this.dotColorsDomainBuffer[3], 
              // this.dotColorsDomainBuffer[5] 
            ],
            dotPowerThresholdBufferInfinity: [
              // this.dotColorsDomainBufferInfinity[3],
              // this.dotColorsDomainBufferInfinity[5]
            ],
            doDotPowerThreshold: true,
        };
    }

    componentDidMount(){
        this.logEvents();
        this.plotCircles();
        // fetch('/testimg').then(data => data.blob()).then(dataBlob => this.setState({brainBlob: URL.createObjectURL(dataBlob)}))
    }

    plotCircles(){
        // console.log(this.props.geometry)
    }

    logEvents(){
        let counter = 0;
        let timer = setInterval(() => {
        if(document.getElementById("main-brain").height !== 0){
            this.setState({imageHeight:document.getElementById("main-brain").height})
            this.setState({imageWidth:document.getElementById("main-brain").width})
            Object.keys( this.props.geometry ).filter(( ch ) => {
                console.log(this.props.geometry[ch])//.u .v
                return true
            });
            clearInterval(timer);
        }
        counter++;

        },500)

    // if() {return}
        

        // setTimeout(() => { this.logEvents() }, 3000)
    }

    update(newData)  {
        if ( newData !== undefined ) {
          this.data = newData;
        }
        if ( !this.brainSvg ) {
          // TODO Error?
          return;
        }
        let brain = this;
        let keyNames = Object.keys(this.data);
        let size = Object.keys(this.data).length;
  
        let brainDots = d3.select( this.baseNodeId ).select( '.fm-brain-dots' ).selectAll( '.fm-brain-dot' )
          .data( this._reformatForDisplay( this.data ), function( d ) {
            return d.channel;
          } );
  
        brainDots.enter().append( 'circle' )
          .attr( 'class', 'fm-brain-dot' )
          .merge( brainDots )
          .classed( 'fm-brain-dot-selected', function( d ) {
            return d.channel === brain.selectedChannel;
          } )
            .style( 'fill', this._dotFill.bind( this ) )
            .call( this._dotPosition.bind( this ) )
            .sort( this._dotOrder.bind( this ) );
  
    };

    autoResize()  {
        if ( !this.aspect ) {
        // Can't determine proper size without aspect ratio
          return;
        };
  
        // TODO This requires the base node to  be visible because of how
        // jQuery works; so, setup must occur when plot is visible!
        var width = $( this.baseNodeId ).width() - ( this.margin.left + this.margin.right );
        var height = width / this.aspect;
  
        if ( width <= 0 || height <= 0 ) {
        // We're not visible so stfu and go away
          return;
        }
        this.resize( width, height );
    };

    resize(width, height)  {
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
    };
    
    _defaultData( channels ) {
        // Return a data map giving zeros for each channel
        return channels.reduce( ( obj, ch ) => {
            obj[ch] = 0.0;
            return obj;
        }, {} );
    };
    
    _reformatForDisplay(data) {
    
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
        } ).map( ch => {
            return {
                channel: ch,
                value: data[ch]
            };
        } );
    };

    setup(imageData, sensorGeometry) {
    
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
          if(this.config==='map')
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
            .then((dimensions) => {
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
    
    };
    
    _dotFilter(d)  {
        // TODO Not a super effective filter ...
        this._dotX( d ) === undefined ? false : true;
    };
    
    _dotFill(d)  {
          return this.dotColorScale( d.value );
    };
    
    _dotVisibility(d)  {
          d.channel === this.selectedChannel ? 'visible' : '';
    
          if( this.config === 'map' ){
            if ( d.value === 0 ) {
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
                if ( d.value === 0 ) {
                  return 'hidden';
                }
              }
            return 'visible';
          }
    };
    
    _dotX(d) {
          var pos = this.sensorGeometry[ d.channel ];
          // TODO Bad way to handle errors
          if ( isNaN( pos.u ) ) {
            return -this.dotXScale( this.dotMaxRadius );
          }
        return this.dotXScale( pos.u );
    };
    
    _dotY(d) {
          var pos = this.sensorGeometry[ d.channel ];
          // TODO Bad way to handle errors
          if ( isNaN( pos.u ) ) {
            return -this.dotXScale( this.dotMaxRadius );
          }
          return this.dotYScale( pos.v );
    };
    
    _dotRadius(d) {
        // TODO Bad way to handle errors
        if ( isNaN( d.value ) ) {
        return this.dotXScale( this.dotRadiusScale( Math.abs( 0.0 ) ) );
        }
        return this.dotXScale( this.dotRadiusScale( Math.abs( d.value ) ) );
    };

    _dotPosition(dot) {
        dot.attr( 'visibility', this._dotVisibility.bind( this ) )
        .attr( 'cx', this._dotX.bind( this ) )
        .attr( 'cy', this._dotY.bind( this ) )
        .attr( 'r', this._dotRadius.bind( this ) );
    };

    _dotOrder(a, b)  {
        // Selected channel is always on top
        if ( a.channel === this.selectedChannel ) {
        return +1;
        }
        if ( b.channel === this.SelectedChannel ) {
        return -1;
        }
        // Smaller dots are on top
        return this._dotRadius( b ) - this._dotRadius( a );
    };

    render(){

        const GeometryHeader = () => {
            if(!Array.isArray(this.props.geometry) ||  !this.props.geometry.length)
            {
                return false
            }
            else{
                console.log(this.props.geometry)
                return <h1>{this.props.geometry.RAF1}</h1>
            }
        }

        return (
        <div>

            <Image ref="mainBrain" id="main-brain" src={this.props.brains} thumbnail responsive/>
            <GeometryHeader />

        </div>
        )
    }
}
function mapStateToProps(state) {
    return {
        brains: state.brains,
        geometry: state.geometry,
    };
  }
  
function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(actions, dispatch),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Brain);