import { configureStore } from '@reduxjs/toolkit'
import subjectsReducer from './subjects'

export const store = configureStore({
  reducer: {
    subjects: subjectsReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch