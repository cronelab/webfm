import {scaleLinear} from 'd3-scale'
  let dotColorScale = scaleLinear()
  //@ts-ignore
  .domain([-9, -5, -2, -0.01, 0.0, 0.01, 2, 5, 9])
  //@ts-ignore
  .range([
    "#313695",
    "#4575b4",
    "#74add1",
    "#abd9e9",
    "#ffffff",
    "#fee090",
    "#fdae61",
    "#f46d43",
    "#d73027",
  ])
  .clamp(true);

  export {
      dotColorScale
  }
