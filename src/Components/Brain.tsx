// Brain.tsx
/**
 * This is the doc comment for file1.ts
 * @packageDocumentation
 */
import React, { useContext, useEffect, useState, ReactSVGElement, useLayoutEffect } from "react";
import { Context } from "../Context";
import { Image } from 'react-bootstrap'

const Brain = (props) => {
  let { subject, setNewSubject }: any = useContext(Context);
  let [electrodes, setElectrodes] = useState()
  let [img, setImg] = useState<string>()
  const [size, setSize] = useState([]);



  useLayoutEffect(() => {
    function updateSize() {
      setSize([document.getElementById('container').offsetWidth, document.getElementById('container').offsetHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  useEffect(() => {
    (async () => {
      console.log(subject)
      let response11 = await fetch(`/api/geometry/${subject.name}`);
      let geometry = await response11.json();
      let response = await fetch(`/api/brain/${subject.name}`);
      let brainRes = await response.arrayBuffer();
      setNewSubject({
        name: subject.name,
        geometry
      })
      let binary = "";
      let bytes = [].slice.call(new Uint8Array(brainRes));
      bytes.forEach((b: any) => (binary += String.fromCharCode(b)));
      setImg(binary)
      let actualCoords = {};


      Object.keys(geometry).forEach(electrodes => {
        actualCoords[electrodes] = {
          u: geometry[electrodes].u,
          v: (1 - geometry[electrodes].v),
          location: geometry[electrodes].location,
        };
      });

      //@ts-ignore
      setElectrodes(actualCoords)
    })()
  }, []);



  return (
    <div
      style={{ "position": "relative", "display": "inline-block" }}
      id="container"
    >
      <Image
        src={img ? `data:image/jpeg;base64,${window.btoa(img)}` : ''}
        style={{ "display": "block", "maxWidth": "100%", "height": "auto" }}
      ></Image>
      <svg
        style={
          {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%"
          }
        }
      >
        {electrodes ?
          //@ts-ignore
          Object.keys(electrodes).map(x => {
            return (<circle
              //@ts-ignore
              id={`${x}_circle`}
              //@ts-ignore
              cx={electrodes[x].u * (size[0] ? size[0] : document.getElementById('container').offsetWidth)}
              //@ts-ignore
              cy={electrodes[x].v * (size[1] ? size[1] : document.getElementById('container').offsetHeight)}
              fill='green'
              r='3'
            ></circle>)
          })

          : <circle></circle>}

      </svg>

    </div >
  );
};

export default Brain;
