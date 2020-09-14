// @ts-nocheck
import React, { useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "react-three-fiber";
import { useGLTFLoader, TrackballControls } from "drei";
import { Mesh } from "three";

export default function ReactFiber(props) {
  let testRef = useRef();
  //@ts-ignore
  const brain = useGLTFLoader(`/api/brain2/PY20N012`);
  console.log(brain.nodes)
  console.log(brain.nodes.SubcorticalStructs)
  console.log(brain.nodes.WhiteMatter)

  //@ts-ignore
  const electrodes = useGLTFLoader(`/api/electrodes/PY20N012`);
  const [isHovered, setIsHovered] = useState(false);
  const color = isHovered ? 0xe5d54d : 0xf95b3c;

  const onHover = useCallback(
    (e, value) => {
      e.stopPropagation(); // stop it at the first intersection
      console.log(e.object.name);
      setIsHovered(value);
    },
    [setIsHovered]
  );

  return (
    <Canvas
      concurrent
      gl={{ antialias: true }}
      camera={{
        position: [0, 0, 500],
        fov: 45,
        aspect: 0.5,
        near: 0.1,
        far: 1000,
      }}
    >
      <group ref={testRef} {...props} dispose={null}>
        <hemisphereLight
          color={"#444444"}
          position={[0, 0, 10]}
        ></hemisphereLight>
        <primitive
          object={electrodes.nodes.Scene}
          material={electrodes.nodes.Scene}
        />
        <primitive
          object={brain.nodes.Gyri}
          onPointerOver={(e) => onHover(e, true)}
          onPointerOut={(e) => onHover(e, false)}
        />
        <primitive
          object={brain.nodes.SubcorticalStructs}
          onPointerOver={(e) => onHover(e, true)}
          onPointerOut={(e) => onHover(e, false)}
        />
        <primitive
          object={brain.nodes.WhiteMatter}
          onPointerOver={(e) => onHover(e, true)}
          onPointerOut={(e) => onHover(e, false)}
        />
      </group>
      <TrackballControls />
    </Canvas>
  );
}
