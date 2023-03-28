import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const subjectsApi = createApi({
  reducerPath: 'subjectsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
      getAllSubjects: builder.query<string[], void>({
          query: () => `subjects`,
      }),
    getSubjectBrain: builder.query<string, string>({
      query: (name) => `brains/${name}`,
    }),
    getSubjectGeometry: builder.query<string, string>({
        query: (name) => `geometry/${name}`,
    }),
    getRecords: builder.query<string[], string>({
        query: (name) => `records/${name}`,
    }),
  }),
})

export const { useGetSubjectBrainQuery, useGetAllSubjectsQuery, useGetRecordsQuery } = subjectsApi