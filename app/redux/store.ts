import { configureStore } from '@reduxjs/toolkit'
import subjectsReducer from './subjects'
import { setupListeners } from '@reduxjs/toolkit/query'
import { subjectsApi } from './api'

export const store = configureStore({
  reducer: {
    [subjectsApi.reducerPath]: subjectsApi.reducer,
    subjects: subjectsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(subjectsApi.middleware),
})
// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch