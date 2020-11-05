import {select, selectAll} from 'd3-selection'

const highlight2DElectrodes = (electrode, color, size?) => {
  let circle = document.getElementById(`${electrode}_circle`);
  console.log(circle)
  if (circle) {
    if (size) {
      circle.setAttribute("r", size);
    }
    circle.setAttribute("fill", color);
  }
};

const highlight3DElectrodes = (electrode, color?, size?) => {
  console.log(electrode)
}

const highlightCenterElectrode = (electrode1,electrode2,color,size) => {
  let circle1 = document.getElementById(`${electrode1}_circle`);
  let circle2 = document.getElementById(`${electrode2}_circle`);
  if(circle1 != null && circle2  != null ){
    let xPos1 = parseFloat(circle1.getAttribute("cx"));
    let xPos2 = parseFloat(circle2.getAttribute("cx"));
    let yPos1 = parseFloat(circle1.getAttribute("cy"));
    let yPos2 = parseFloat(circle2.getAttribute("cy"));
    let xPos = (xPos1+xPos2)/2
    let yPos = (yPos1+yPos2)/2
    select("#container")
    .select("svg")
    .append("circle")
    .attr("cx", xPos)
    .attr("cy", yPos)
    .attr("r", size)
    .attr("fill", color);
  
  }
}

const clearElectrodes = () => {
  selectAll('circle').attr('fill','white')
  selectAll('line').remove()
}

const createLine = (electrode1, electrode2, color) => {
  if (color == "") color = "pink";
  // var pathData = symbol().type(symbolStar).size(80);

  let circle1 = document.getElementById(`${electrode1}_circle`);
  let circle2 = document.getElementById(`${electrode2}_circle`);
    let xPos1 = parseFloat(circle1.getAttribute("cx"));
    let xPos2 = parseFloat(circle2.getAttribute("cx"));
    let yPos1 = parseFloat(circle1.getAttribute("cy"));
    let yPos2 = parseFloat(circle2.getAttribute("cy"));
    let line = select("#container")
      .select("svg")
      .append("line")
      .attr("x1", xPos1)
      .attr("y1", yPos1)
      .attr("x2", xPos2)
      .attr("y2", yPos2)
      .attr("stroke-width", "5")
      .attr("stroke", color);

};
export {
  highlight2DElectrodes, createLine,highlightCenterElectrode,clearElectrodes,
  highlight3DElectrodes
}