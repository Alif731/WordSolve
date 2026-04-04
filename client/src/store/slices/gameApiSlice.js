import { apiSlice } from "./apiSlice"; // Import the motherboard

// 1. Inject endpoints into the parent API
export const gameApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- GAME ROUTES ---
    getProblem: builder.query({
      query: (_username) => "/learning/problem",
      providesTags: ["Problem"],
    }),

    getUserStatus: builder.query({
      query: (_username) => "/learning/status",
      providesTags: ["UserStatus"],
    }),

    submitAnswer: builder.mutation({
      query: (payload) => ({
        url: "/learning/submit",
        method: "POST",
        body: payload,
      }),
      // Magic: Refresh UserStatus AND Problem when an answer is submitted
      invalidatesTags: ["Leaderboard", "UserStatus", "Activity", "Problem"],
    }),
  }),
  overrideExisting: false, // Prevent errors in hot-reloading
});

// 2. Export the auto-generated hooks
export const {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
} = gameApiSlice;
