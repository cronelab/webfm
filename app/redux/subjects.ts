import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface SubjectsState {
  subjects: string[],
  currentSubject: string,
}

const initialState: SubjectsState = {
  subjects: [],
  currentSubject: '',
}

export const subjectsSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    addSubjects: (state, action: PayloadAction<string[]>) => {
      state.subjects = action.payload
    },
    setCurrentSubject: (state, action: PayloadAction<string>) => {
      state.currentSubject = action.payload
    }
  },
})

export const { addSubjects,setCurrentSubject } = subjectsSlice.actions

export default subjectsSlice.reducer