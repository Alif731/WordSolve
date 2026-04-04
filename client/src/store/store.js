import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { apiSlice } from "./slices/apiSlice"; // Import the parent slice

const store = configureStore({
  reducer: {
    auth: authReducer,
    // The parent slice handles the reducer logic for ALL injected endpoints
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export default store;
