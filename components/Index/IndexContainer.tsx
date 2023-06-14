'use client'
import React from 'react'
import Metadata from './Metadata'
import Online from './Online'
import Records from './Records'
import Subjects from './Subjects'
import { store } from '../../app/redux/store'
import { Provider } from 'react-redux'
import styles from './Index.module.scss'
import { BrainContainer } from '../Shared/BrainContainer'
import { Header } from '../Shared/Header'
import { useAppSelector } from '../../app/redux/hooks'

const MenuColumn = () => {
  const { currentSubject } = useAppSelector(state => state.subjects)
  const { onlineState } = useAppSelector(state => state.online)
  return (
    <div
      style={{
        display: 'flex',
        height: '84vh',
        justifyContent: 'space-between',
      }}
    >
      <div className={styles.column1}>
        {onlineState ? <Online /> : <Subjects />}
        {currentSubject && (
          <>
            <Metadata />
            <Records />
          </>
        )}
      </div>
      <div className={styles.imageContainer}>
        <BrainContainer />
      </div>
    </div>
  )
}

export const IndexContainer = () => {
  return (
    <Provider store={store}>
      <Header />
      <MenuColumn />
    </Provider>
  )
}

export default IndexContainer
