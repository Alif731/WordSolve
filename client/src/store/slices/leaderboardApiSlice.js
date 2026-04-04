import { apiSlice } from "./apiSlice";

const LEADERBOARD_URL = "/leaderboard";

export const leaderboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboardStatus: builder.query({
      query: () => ({
        url: `${LEADERBOARD_URL}/status`,
        method: "GET",
      }),
      providesTags: ["LeaderboardSettings"],
    }),
    updateLeaderboardStatus: builder.mutation({
      query: (enabled) => ({
        url: `${LEADERBOARD_URL}/status`,
        method: "PUT",
        body: { enabled },
      }),
      invalidatesTags: ["LeaderboardSettings", "Leaderboard"],
    }),
    getLeaderboard: builder.query({
      query: (limit = 20) => ({
        url: `${LEADERBOARD_URL}?limit=${limit}`,
        method: "GET",
      }),
      providesTags: ["Leaderboard"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLeaderboardStatusQuery,
  useUpdateLeaderboardStatusMutation,
  useGetLeaderboardQuery,
} = leaderboardApiSlice;
