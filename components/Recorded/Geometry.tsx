import { useEffect, useState } from 'react'

export const Geometry = ({ geometry }) => {
  const [brainHeight, setBrainHeight] = useState(0)
  const [brainWidth, setBrainWidth] = useState(0)

  useEffect(() => {
    let brainElement = document.getElementById('main-brain')
    setBrainHeight(brainElement.clientHeight)
    setBrainWidth(brainElement.clientWidth)
  }, [geometry])

  useEffect(() => {}, [brainHeight, brainWidth])

  return (
    <>
      <svg
        style={{
          height: brainHeight,
          width: brainWidth,
          position: 'absolute',
          zIndex: 10,
        }}
      >
        {Object.keys(geometry).map((channel, index) => {
          return (
            <circle
              key={channel}
              id={channel}
              cx={geometry[channel].u * brainWidth}
              cy={(1 - geometry[channel].v) * brainHeight}
              r="3"
              fill="red"
            />
          )
        })}
        {/* <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /> */}
      </svg>
    </>
  )
}
export default Geometry
