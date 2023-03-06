import { useEffect } from "react"
import ChannelRaster from "../../app2/main/fmraster"
const raster = new ChannelRaster('#fm')

export const Raster = () => {
  useEffect(() => {
    raster.setup();
  }, [])
  return (
    <>
      <div id="fmContainer">
        <div id="fm"></div>
      </div>
    </>
  )
}
export default Raster
