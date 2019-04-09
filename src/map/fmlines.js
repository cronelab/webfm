// =
//
// fmraster
// Raster display manager for WebFM
//
// =

// REQUIRES
var $ = require( 'jquery' );
var d3 = require( 'd3' );

// Promise compatibility
require( 'setimmediate' );
var Promise = require( 'promise-polyfill' );


// MODULE OBJECT
var fmlines = {};

// MAIN CLASS
fmlines.ChannelLines = function() {

  this.data           = null;

  this.timeScale      = null;
  this.trialNum       = null;
  this.currInd        = null;
  // Events

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
  this.displayOrder = null;
  this.chartMargin = {
    top: 100,
    right: 0,
    bottom: 0,
    left: 0
  };
};

fmlines.ChannelLines.prototype = {

  constructor: fmlines.ChannelLines,

  setup: function() {

    this.setupCharts();
    this.timeRange = [-1,1];

  },



  _dummyData: function( channels ) {
    return channels.reduce( function( obj, ch ) {
      obj[ch] = [0.0];
      return obj;
    } );
  },

  setupCharts: function() {

    if ( !this.displayOrder ) {
      // Can't.
      return;
    }

    if ( !this.data ) {
      // Create some dummy data
      this.data = this._dummyData( this.displayOrder );
    }

    if(!this.currInd)
    {
      this.currInd = 1;
    }

    var allTheData = this.data
    var trialNum = this.trialNum;




    var margin = {top: 20, right: 20, bottom: 30, left: 50},
    lineWidth = 600 - margin.left - margin.right,
    lineHeight = 400 - margin.top - margin.bottom;
    var x = d3.scaleLinear().range([0, lineWidth]);
    var y = d3.scaleLinear().range([lineHeight, 0]);
    var lineGraphData = [];
    var xVals = linspace(this.timeRange[0],this.timeRange[1],allTheData[0].values.length)
    xVals.forEach(function(e){
      lineGraphData.push({
        xVal: e
      })
    })


    d3.select(".fm-lineChart").selectAll("svg").remove();

    var svg = d3.select('#lineChart').select('.fm-lineChart').append("svg")
    .attr("class","childElsvg")
    .attr("width", lineWidth + margin.left + margin.right)
    .attr("height", lineHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var line = d3.line()
    .x(function(d) { return x(d.xVal); })
    .y(function(d) { return y(d.yVal); })
    .curve(d3.curveNatural)



  lineGraphData.forEach(function(e,i){
    var ind=$('#chanSel>li.active').index()
    if(ind==-1){ind=0}
    e.yVal = allTheData[ind].values[i]
  });


  //y.domain([-5,5])
  //RESTORE ABOVE LINE TO HAVE A FIXED AXIS
  y.domain(d3.extent(lineGraphData, function(d) { return d.yVal; }));
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

  svg.append("text")
  .attr("x", (lineWidth / 2))
  .attr("y", 10 - (margin.top / 2))
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .text("StimulusCode: " + document.getElementById('currentStimCode').innerText);


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

  document.getElementById('stimSel').addEventListener("click", function(e){
    // console.log("Index of Stimulus selection: " + e.target)
    // console.log("these are trial numbers? : " + trialNum);

});


      document.getElementById('chanSel').addEventListener("click", function(e){

        $("#"+e.target.parentNode.parentNode.id + ">li.active").removeClass("active")
        e.target.parentNode.className += " active";
        d3.select("path").remove()
        // document.getElementsByClassName("childElsvg")[0].children[0].removeChild(document.getElementsByClassName("childElsvg")[0].children[0].childNodes[5])
        lineGraphData.forEach(function(e,i){
          var ind=$('#chanSel>li.active').index()
          if(ind==-1){ind=0}
          e.yVal = allTheData[ind].values[i]
        });
        y.domain(d3.extent(lineGraphData, function(d) { return d.yVal; }));

        var line = d3.line()
        .x(function(d) { return x(d.xVal); })
        .y(function(d) { return y(d.yVal); })
        .curve(d3.curveNatural)
        svg.append("path")
        .datum(lineGraphData)
        .attr("class", "line")
        .attr("d", line);
      });




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
setTrialNumber: function(trialNum){
    this.trialNum = trialNum;
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
module.exports = fmlines;

//
