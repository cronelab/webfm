//TODO:
  //chart margin
  //channel to plot
  //how many plots
    //subplots?
    //movable plots?
  //Scale/Axis!
  //Resize
  //Start/stop
  //buffering size
  //update time


import * as d3 from "d3";

export const generateChart = allData => {
  var margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = 1000 - margin.left - margin.right, // Use the window's width
    height = 250 - margin.top - margin.bottom; // Use the window's height

  let data = allData[0];
  console.log(data)
  let dataset = data.map(x => {
    return { y: x };
  });

  d3.select("#fm-chart-container")
    .selectAll("svg > *")
    .remove();
  const svg = d3.select("#fm-chart");

  svg
    .attr("width", width - margin.left - margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xScale = d3
    .scaleLinear()
    .domain([0, data.length - 1]) // input
    .range([0, width]); // output

  // 6. Y scale will use the randomly generate number
  var yScale = d3
    .scaleLinear()
    .domain([-100, 100]) // input
    .range([height, 0]); // output

  // 7. d3's line generator
  var line = d3
    .line()
    .x(function(d, i) {
      return xScale(i);
    }) // set the x values for the line generator
    .y(function(d) {
      return yScale(d.y);
    }) // set the y values for the line generator
    .curve(d3.curveMonotoneX); // apply smoothing to the line

  // 1. Add the SVG to the page and employ #2

  // 3. Call the x axis in a group tag
  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

  // 4. Call the y axis in a group tag
  svg
    .append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

  // 9. Append the path, bind the data, and call the line generator
  svg
    .append("path")
    .datum(dataset) // 10. Binds data to the line
    .attr("class", "line") // Assign a class for styling
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", "black");
};

/* 
  If still using Unity at the end of all this:

  update: function( newData ) {
        if ( newData !== undefined ) {
          this.data = newData;
        }

        if(gameInstance != null){

          var keyNames = Object.keys(this.data);
          var size = Object.keys(this.data).length;
          for (var i = 0; i < size; i++) {
            if(keyNames[i] != undefined)
            {
              if(document.title == "WebFM: Live"){
                // for pete's sake, find a better way to threshold
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
        }

    }

*/