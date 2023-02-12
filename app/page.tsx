import IndexContainer from '../components/Index/IndexContainer'
import fs from 'fs';

export const metadata = {
  title: 'My Page Title',
}

export default function Page() {
  const subjects = fs.readdirSync(process.env.DATA_DIR).filter(file => file !== '.gitignore').sort();

  return (
    <>
      <IndexContainer subjects={subjects} />
    </>
  )
}
