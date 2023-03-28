import Image from 'next/image'
import { useGetSubjectBrainQuery } from '../../app/redux/api'
import { useAppSelector } from '../../app/redux/hooks'
export const BrainContainer = () => {
  const subject = useAppSelector(state => state.subjects.currentSubject)
  const { data, error, isLoading } = useGetSubjectBrainQuery(subject)
  return (
    <>
    {data && (
        <Image src={data} fill alt="brainImage" />

    )}
    </>
  )
}
