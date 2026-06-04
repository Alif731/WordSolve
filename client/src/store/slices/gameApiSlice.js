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
      invalidatesTags: ["Leaderboard", "UserStatus", "Activity"],
      // invalidatesTags: ["Leaderboard", "UserStatus", "Activity"],
    }),

    // Jump to a specific concept (used by Student Hub)
    jumpToConcept: builder.mutation({
      query: (payload) => ({
        url: "/learning/jump",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Problem", "UserStatus"],
    }),

    switchSection: builder.mutation({
      query: (payload) => ({
        url: "/learning/switch-section",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Problem", "UserStatus"],
    }),
  }),
  overrideExisting: false, // Prevent errors in hot-reloading
});

// 2. Export the auto-generated hooks
export const {
  useGetProblemQuery,
  useGetUserStatusQuery,
  useSubmitAnswerMutation,
  useJumpToConceptMutation,
  useSwitchSectionMutation,
} = gameApiSlice;
