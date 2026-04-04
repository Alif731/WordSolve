// src/store/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  credentials: "include",
});

const getRequestUrl = (args) => (typeof args === "string" ? args : args?.url || "");
const AUTH_FAILURE_MESSAGES = new Set([
  "Not authorized, token failed",
  "Not authorized, no token",
  "Not authorized, user not found",
]);

const isPublicAuthRequest = (url) =>
  url.startsWith("/users/auth") ||
  url === "/users" ||
  url.startsWith("/users/logout") ||
  url.startsWith("/users/oauth/");

const baseQueryWithAuthRecovery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const requestUrl = getRequestUrl(args);
  const errorMessage =
    typeof result?.error?.data === "object" ? result.error.data?.message : undefined;

  if (
    result?.error?.status === 401 &&
    AUTH_FAILURE_MESSAGES.has(errorMessage) &&
    !isPublicAuthRequest(requestUrl)
  ) {
    api.dispatch(logout());
  }

  return result;
};

// 1. Create the empty split API
export const apiSlice = createApi({
  reducerPath: "api", // The key in the store
  baseQuery: baseQueryWithAuthRecovery,
  // 2. Define global tag types here so all injected files can use them
  tagTypes: [
    "UserStatus",
    "Problem",
    "User",
    "Activity",
    "Leaderboard",
    "LeaderboardSettings",
  ],

  // 3. Leave endpoints empty for code splitting
  endpoints: () => ({}),
});
