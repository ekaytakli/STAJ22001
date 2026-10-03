import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import todosReducer from "./todosSlice";

// Tüm uygulamanın merkezi veri deposu (Store).
// Kullanıcı oturumu ve görevler burada tek bir çatı altında toplanır.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todosReducer,
  },
});

// TypeScript'in Redux hafızasını ve eylemlerini tam tanıması için tip tanımları.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;