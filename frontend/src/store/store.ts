/**
 * UYGULAMANIN MERKEZİ VERİ DEPOSU (REDUX STORE)
 *
 * Bu dosya, tüm uygulamanın global hafızasının ana merkezidir.
 * Kullanıcı oturumunu yöneten 'auth' dilimi ile görev listesini yöneten 'todos'
 * dilimini tek bir çatı altında birleştirir. Tüm sayfalar ihtiyaç duyduğu veriyi
 * doğrudan buradan okur veya buraya yazar.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout } from "./authSlice";
import todosReducer, { clearTodos } from "./todosSlice";
import { persistSession } from "./session";
import { setUnauthorizedHandler } from "../api/axios";

// Tüm uygulamanın merkezi veri deposu (Store).
// Kullanıcı oturumu ve görevler burada tek bir çatı altında toplanır.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    todos: todosReducer,
  },
});

let previousAuth = store.getState().auth;
persistSession(previousAuth.user, previousAuth.token);
store.subscribe(() => {
  const auth = store.getState().auth;
  const tokenChanged = auth.token !== previousAuth.token;
  if (auth.user !== previousAuth.user || auth.token !== previousAuth.token) {
    persistSession(auth.user, auth.token);
  }
  previousAuth = auth;
  if (tokenChanged) store.dispatch(clearTodos());
});
setUnauthorizedHandler(() => store.dispatch(logout()));

// TypeScript'in Redux hafızasını ve eylemlerini tam tanıması için tip tanımları.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
