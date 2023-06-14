import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  useGetSubjectBrainQuery,
  useGetSubjectGeometryQuery,
} from '../../app/redux/api'
import { useAppSelector } from '../../app/redux/hooks'
export const BrainContainer = () => {
  const subject = useAppSelector(state => state.subjects.currentSubject)

  const svgRef = useRef<SVGSVGElement>(null)
  const brainRef = useRef<HTMLImageElement>(null)
  const [brainHeight, setBrainHeight] = useState(0)
  const [brainWidth, setBrainWidth] = useState(0)

  const { data: image } = useGetSubjectBrainQuery(subject)
  const { data: geo } = useGetSubjectGeometryQuery(subject)

  useEffect(() => {
    setBrainHeight(brainRef.current?.clientHeight || 0)
    setBrainWidth(brainRef.current?.clientWidth || 0)
  }, [geo, image])

  return (
    <>
      <div style={{ objectFit: 'contain' }}>
        {geo && (
          <svg
            ref={svgRef}
            style={{
              height: brainHeight,
              width: brainWidth,
              position: 'absolute',
              zIndex: 10,
            }}
          >
            {brainRef.current &&
              Object.keys(geo).map((channel, index) => {
                return (
                  <circle
                    key={channel}
                    id={channel}
                    cx={geo[channel].u * brainWidth}
                    cy={(1 - geo[channel].v) * brainHeight}
                    r="3"
                    fill="red"
                  />
                )
              })}
          </svg>
        )}
        {image && (
          <Image
            ref={brainRef}
            id="main-brain"
            // @ts-ignore
            src={image}
            alt="brainImage"
            fill
          />
        )}
      </div>
    </>
  )
}
