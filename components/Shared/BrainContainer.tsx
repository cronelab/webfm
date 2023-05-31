import Image from 'next/image'
import { useEffect, useRef } from 'react'
import {
  useGetSubjectBrainQuery,
  useGetSubjectGeometryQuery,
} from '../../app/redux/api'
import { useAppSelector } from '../../app/redux/hooks'
import * as d3 from 'd3'
export const BrainContainer = () => {
  const subject = useAppSelector(state => state.subjects.currentSubject)
  const { data: brainImage } = useGetSubjectBrainQuery(subject)
  const { data: geometry } = useGetSubjectGeometryQuery(subject)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (geometry === undefined || brainImage === undefined) return
    Object.values(geometry).forEach(value => {
      const svg = d3.select(svgRef.current)
      svg
        .append('circle')
        .attr('cx', value.u * svgRef.current.clientWidth)
        .attr('cy', (1 - value.v) * svgRef.current.clientHeight)
        .attr('r', 3)
        .attr('fill', 'white')
    })
  }, [geometry, brainImage])

  return (
    <>
      {brainImage && (
        <>
          <Image
            src={brainImage}
            style={{ objectFit: 'contain' }}
            fill
            alt="brainImage"
          />
          <svg
            ref={svgRef}
            style={{
              display: 'block',
              height: '100%',
              width: '100%',
              zIndex: 2,
              position: 'absolute',
            }}
          ></svg>{' '}
        </>
      )}
    </>
  )
}
