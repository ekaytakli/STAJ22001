import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import todosReducer from "./todosSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todosReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
