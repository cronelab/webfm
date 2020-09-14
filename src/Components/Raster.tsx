import React, { useContext, useEffect, useState } from "react";
import {select} from 'd3'
import { Context } from "../Context";
const Raster = (props) => {
  let { bciState, setBciState, setNewRecord, setNewSubject, modality,setModality } = useContext(Context);

  return (
      <>
      {props.numChannels.map(chan => {
        return (
          <h1>{chan}</h1>
        )
      })}
      </>
  )
}

export default Raster