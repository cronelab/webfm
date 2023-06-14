import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface OnlineState {
  onlineState: boolean
  sourceAddress: string
}

const initialState: OnlineState = {
  onlineState: false,
  sourceAddress: 'ws://localhost',
}

export const onlineSlice = createSlice({
  name: 'online',
  initialState,
  reducers: {
    toggleOnline: (state, action: PayloadAction<boolean>) => {
      state.onlineState = action.payload
    },
    setSourceAddress: (state, action: PayloadAction<string>) => {
      state.sourceAddress = action.payload
    },
  },
})

export const { toggleOnline, setSourceAddress } = onlineSlice.actions

export default onlineSlice.reducer
