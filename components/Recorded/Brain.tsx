import Image from 'next/image'
export const Brain = ({ image }) => {
  return (
    <>
      <Image
        id="main-brain"
        src={image}
        alt="main-brain"
        fill
        // style={{ objectFit: 'contain' }}
      />
    </>
  )
}
export default Brain
