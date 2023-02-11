import Header from '../components/Header'
import Footer from '../components/Footer'
import Inputs from '../components/Inputs'
import IndexContainer from '../components/IndexContainer'
import fs from 'fs';

export const metadata = {
  title: 'My Page Title',
}

export default function Page() {
  const subjects = fs.readdirSync(process.env.DATA_DIR).filter(file => file !== '.gitignore').sort();

  return (
    <>
      <IndexContainer subjects={subjects} />
      <Inputs />
    </>
  )
}
