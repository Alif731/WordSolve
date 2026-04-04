import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // 1. Save user data on Login
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    // 2. Clear data on Logout
    logout: (state) => {
      state.userInfo = null;
      localStorage.removeItem("userInfo");
    },
    // 3. Update Progress (e.g., when unlocking a level)
    updateProgress: (state, action) => {
      // Merges the new progress data into the existing user info
      state.userInfo = { ...state.userInfo, ...action.payload };
      localStorage.setItem("userInfo", JSON.stringify(state.userInfo));
    },
  },
});

export const { setCredentials, logout, updateProgress } = authSlice.actions;
export default authSlice.reducer;
