// ======================================================================== //
//
// fmbrain
// Manager for brain visualization
//
// ======================================================================== //


// REQUIRES

// MODULE OBJECT

var fmbrain3 = {};


// MAIN CLASS

fmbrain3.BrainVisualizer = function() {
  this.data               = null;

};


fmbrain3.BrainVisualizer.prototype = {

    constructor: fmbrain3.BrainVisualizer,
    //
    // setup: function( imageData, sensorGeometry ) {
    //   },


      update: function( newData ) {
        if ( newData !== undefined ) {
          this.data = newData;
        }


        var keyNames = Object.keys(this.data);
        var size = Object.keys(this.data).length;

        for (var i = 1; i <= size; i++) {
          if(document.title == "WebFM: Live"){
            if(eval("this.data."+keyNames[i]) > 10){
              gameInstance.SendMessage(keyNames[i], "activityChanger", eval("this.data."+keyNames[i]));
            }
            else
            {
              gameInstance.SendMessage(keyNames[i], "activityChanger", 0.0);
            }
          }
          else{
            gameInstance.SendMessage(keyNames[i], "activityChanger", eval("this.data."+keyNames[i]));
          }
        }
    }
  };
  // EXPORT MODULE
  module.exports = fmbrain3;
