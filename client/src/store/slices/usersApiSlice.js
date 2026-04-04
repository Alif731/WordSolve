import { apiSlice } from "./apiSlice";

const USERS_URL = "/users";

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/auth`,
        method: "POST",
        body: data,
      }),
      // When we login, refresh the profile and activity immediately
      invalidatesTags: ["User", "Activity"],
    }),
    register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/logout`,
        method: "POST",
      }),
      // Clear the cache on logout so the next user doesn't see old data
      invalidatesTags: ["User", "Activity"],
    }),
    getUserProfile: builder.query({
      query: () => ({
        url: `${USERS_URL}/profile`,
        method: "GET",
      }),
      providesTags: ["User"], // This query "subscribes" to the User tag
    }),
    updateUser: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: "PUT",
        body: data,
      }),
      // This is the "Magic" line: it tells RTK to re-fetch
      // any query currently using these tags.
      invalidatesTags: ["User", "Activity"],
    }),
    getRecentActivity: builder.query({
      query: () => ({
        url: `${USERS_URL}/recent-activity`,
        method: "GET",
      }),
      providesTags: ["Activity"], // Subscribes to Activity tag
    }),
    getOAuthProviders: builder.query({
      query: () => ({
        url: `${USERS_URL}/oauth/providers`,
        method: "GET",
      }),
    }),
    // Add this to your endpoints
    getClassroomStats: builder.query({
      query: () => ({
        url: "/teacher/stats",
        method: "GET",
      }),
      // 🔥 Added this so we can "force" a refresh if a teacher sends a nudge
      providesTags: ["ClassStats"],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery,
  useGetOAuthProvidersQuery,
  useGetClassroomStatsQuery,
  useUpdateUserMutation,
  useGetRecentActivityQuery,
} = usersApiSlice;
