import { useEffect, useRef } from 'react'
// import ChannelRaster from '../../app2/main/fmraster'
// const raster = new ChannelRaster('#fm')
import * as horizon from 'd3-horizon-chart'
import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { extent } from 'd3-array'

export const Raster = ({ data }) => {
  const fmContainerRef = useRef()

  useEffect(() => {
    if(data){
    let chartContainer = fmContainerRef.current
    console.log(chartContainer)
    let step = chartContainer.offsetWidth / 30 //dataset.displayData.Ch1.length;
    console.log(Object.keys(data.displayData))

    let horizonChart = horizon
      .horizonChart()
      .height(30)
      // @ts-ignore
      .step(step)
      .colors([
        '#313695',
        '#4575b4',
        '#74add1',
        '#abd9e9',
        // "#ffffff",
        '#fee090',
        '#fdae61',
        '#f46d43',
        '#d73027',
      ])

    select(chartContainer).append('svg').attr('class', 'fm-cursor-svg')
    console.log(data.contents.times)
    let x = scaleLinear()
      .domain(extent(data.contents.times))
      .range([0, chartContainer.offsetWidth])

    select(chartContainer)
      .selectAll('.fm-horizon')
      // @ts-ignore
      .data(Object.values(data.displayData))
      .enter()
      .append('div')
      .attr('class', 'fm-horizon')
      .attr('style', 'outline: thin solid black; height: 20px;')
      .each(horizonChart)
      .select('.title')
      .text((d, i) => Object.keys(data.displayData)[i])

    select('.fm-cursor-svg')
      .attr('width', chartContainer.offsetWidth)
      .attr('height', chartContainer.offsetHeight)
      .append('line')
      .attr('class', 'zeroLine')
      .style('stroke', 'black')
      .attr('stroke-width', 3)
      .attr('x1', x(0))
      .attr('y1', 0)
      .attr('x2', x(0))
      .attr('y2', chartContainer.offsetHeight)

    select('.fm-cursor-svg')
      .append('line')
      .attr('class', 'cursorLine')
      .style('stroke', 'red')
      .attr('stroke-width', 3)
      .attr('x1', x(1))
      .attr('y1', 0)
      .attr('x2', x(1))
      .attr('y2', chartContainer.offsetHeight)
    }

  }, [data])
  return (
    <>
      <div id="fmContainer" ref={fmContainerRef}>
        <div id="fm"></div>
      </div>
    </>
  )
}
export default Raster
