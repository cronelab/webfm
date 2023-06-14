import { Container, Row, Col } from 'react-bootstrap'
import Raster from './Raster'
import { useEffect, useState } from 'react'
import { useAppSelector } from '../../app/redux/hooks'
import { BrainContainer } from '../Shared/BrainContainer'
import styles from './styles.module.scss'
import Dataset from '../../app2/main/fmdata'
export default function RecordedContainer() {
  const subject = useAppSelector(state => state.subjects.currentSubject)
  const [dataset2, setDataset] = useState(null)
  useEffect(() => {
    ;(async () => {
      try {
        let record = '2022_09_01_Gestures_block1'
        let req = await fetch(`/api/data/${subject}/${record}`)
        let recordInfo = await req.json()
        console.log(recordInfo)

        const dataset = new Dataset(recordInfo.metadata, recordInfo.contents)
        await dataset._validate()
        dataset._setupChannelStats()
        dataset._updateDisplayData()
        setDataset(dataset)
        // document.getElementsByClassName('fm-subject-name')[0].innerHTML =
        //   recordInfo.metadata.subject
        //   setBrainImage(recordInfo.metadata.brainImage)
        //   setSensorGeometry(recordInfo.metadata.sensorGeometry)
      } catch (err) {
        console.log(err)
      }
    })()
  }, [])
  return (
    <div style={{ height: '86vh', display: 'flex' }}>
      <div className={styles.rasterContainer}>
        <Raster data={dataset2} />
        <h1>test</h1>
      </div>
      <div className={styles.imageContainer}>
        <BrainContainer />
      </div>
    </div>
  )
}
