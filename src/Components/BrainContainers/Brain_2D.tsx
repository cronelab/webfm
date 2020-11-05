import React, { useRef, useState, useContext, useEffect } from "react";
import { Image, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Context } from "../../Context";
import {
  fetch2DGeometry,
  fetch2DBrain,
  fetchAnatomicalLocations,
} from "../../helpers/pullAnatomicalData";
export default function Brain_2D() {
  const {
    activeSubject,
    twoDReconstructionCircles,
    setTwoDReconstructionCircles,
  } = useContext(Context);
  const [img, setImg] = useState(null);
  const [geometry, setGeometry] = useState(null);
  const circleRef = useRef([]);
  const [anatomicalLocations, setAnatomicalLocations] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (img) {
      let circles = Object.keys(geometry).map((elecs, index) => {
        return (
          <OverlayTrigger
            key={`${elecs}_trigger`}
            placement="right"
            delay={{ show: 100, hide: 300 }}
            overlay={
              <Tooltip key={`${elecs}tooltip`} id="button-tooltip">
                {`${elecs} : ${anatomicalLocations[index][4]}`}
              </Tooltip>
            }
          >
            <circle
              ref={(el) => (circleRef.current[index] = el)}
              id={`${elecs}_circle`}
              key={`${elecs}_circle`}
              cx={geometry[elecs].u * containerRef.current.clientWidth}
              cy={(1 - geometry[elecs].v) * containerRef.current.clientHeight}
              fill="white"
              stroke="black"
              r="2"
            ></circle>
          </OverlayTrigger>
        );
      });
      setTwoDReconstructionCircles(circles);
    }
  }, [img]);

  useEffect(() => {
    (async () => {
      if (activeSubject != null) {
        let brainImage = await fetch2DBrain(activeSubject);
        let geometry = await fetch2DGeometry(activeSubject);
        let anatomy = await fetchAnatomicalLocations(activeSubject);
        setAnatomicalLocations(anatomy);
        setGeometry(geometry);
        setImg(brainImage);
      }
    })();
  }, [activeSubject]);
  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
      }}
      id="container"
      // onDoubleClick={(e) => {
      //   e.preventDefault();
      //   setModify(true);
      // }}
    >
      <Image
        ref={containerRef}
        src={img}
        style={{ display: "block", width: "100%", height: "100%" }}
      ></Image>
      <svg
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        }}
      >
        {twoDReconstructionCircles}
      </svg>
    </div>
  );
}
