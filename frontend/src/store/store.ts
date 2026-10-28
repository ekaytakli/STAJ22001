/**
 * UYGULAMANIN MERKEZİ VERİ DEPOSU (REDUX STORE)
 *
 * Bu dosya, tüm uygulamanın global hafızasının ana merkezidir.
 * Kullanıcı oturumunu yöneten 'auth' dilimi ile görev listesini yöneten 'todos'
 * dilimini tek bir çatı altında birleştirir. Tüm sayfalar ihtiyaç duyduğu veriyi
 * doğrudan buradan okur veya buraya yazar.
 */

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