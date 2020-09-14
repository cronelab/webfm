import React, { useContext } from "react";
import Brain from './Brain'
import Brain_3D from './Brain_3D'
import { Context } from "../Context";

const BrainSelector = () => {
  const { whichBrain } = useContext(Context);

  return(
      <>
    {whichBrain == "2aD" ? <Brain containerID={"container"}></Brain> :<Brain_3D></Brain_3D>}
      </>
  )

};

export default BrainSelector