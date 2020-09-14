import React, { useState, useContext, useRef, useEffect } from "react";
import { select } from "d3-selection";
import { symbol, symbolStar } from "d3-shape";
import * as d3 from "d3";

// Stuff to add:
// visual events
// Add location of events

const highlightElectrodes = (electrode, color, size?) => {
  let circle = document.getElementById(`${electrode}_circle`);
  if (circle) {
    if (size) {
      circle.setAttribute("r", size);
    }
    circle.setAttribute("fill", color);
  }
};

const removeAllAttributes = (electrodes) => {
  electrodes.forEach((electrode) =>
    document.getElementById(`${electrode}_circle`).setAttribute("fill", "white")
  );
  select("#container").select("svg").selectAll("line").remove();
};

const createShape = (electrode1, electrode2) => {
  let circle1 = document.getElementById(`${electrode1}_circle`);
  let circle2 = document.getElementById(`${electrode2}_circle`);
  let x = parseFloat(circle1.getAttribute("cx"));
  let y = parseFloat(circle2.getAttribute("cx"));
  let yPos1 = parseFloat(circle1.getAttribute("cy"));
  let yPos2 = parseFloat(circle2.getAttribute("cy"));

  var size = 20,
    // x = 0,
    // y = 0,
    value = 1.0, //Range is 0.0 - 1.0
    borderWidth = 3,
    borderColor = "black",
    starColor = "#FFB500",
    backgroundColor = "white";

  var line = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);
  //   .interpolate("linear-closed"),
  let rad = function (deg) {
      return (deg * Math.PI) / 180;
    },
    cos = function (deg) {
      return Math.cos(rad(deg));
    },
    sin = function (deg) {
      return Math.sin(rad(deg));
    },
    tan = function (deg) {
      return Math.tan(rad(deg));
    },
    n = size,
    m = n / 2,
    h = m * tan(36),
    k = h / sin(72),
    //(x, y) points at the leftmost point of the star, not the center
    coordinates = [
      { x: x, y: y },
      { x: x + k, y: y },
      { x: x + m, y: y - h },
      { x: x + n - k, y: y },
      { x: x + n, y: y },
      { x: x + n - k * cos(36), y: y + k * sin(36) },
      { x: x + n * cos(36), y: y + n * sin(36) },
      { x: x + m, y: y + h },
      { x: x + n - n * cos(36), y: y + n * sin(36) },
      { x: x + k * cos(36), y: y + k * sin(36) },
    ];
  let selection = select("#container").select("svg");
  //inside star
  selection
    .append("path")
    .attr("d", line(coordinates))
    .style({ "stroke-width": 0, fill: starColor });

  //Rect for clipping
  //In order to avoid potential ID duplicates for clipping, clip-path is not used here
  selection
    .append("rect")
    .attr("x", x + size * value)
    .attr("y", y - h)
    .attr("width", size - size * value)
    .attr("height", size)
    .style("fill", backgroundColor);

  //border of the star
  selection
    .append("path")
    .attr("d", line(coordinates))
    .style({ "stroke-width": borderWidth, fill: "none", stroke: borderColor });
};

const createLine = (electrode1, electrode2, color) => {
  if (color == "") color = "pink";
  var pathData = symbol().type(symbolStar).size(80);

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
export { highlightElectrodes, createLine, removeAllAttributes, createShape };
