import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { login as loginRequest, register as registerRequest } from "../api/authService";
import type { LoginRequest, RegisterRequest } from "../types";

// Kullanıcının kimlik ve kullanıcı adı yapısı.
interface AuthUser {
  id: number;
  username: string;
}

// Kimlik doğrulama hafızasında (auth state) tuttuğumuz veriler.
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Sayfa yenilendiğinde oturumun kapanmaması için tarayıcı hafızasından önceki kayıtları alıyoruz.
const savedUser = localStorage.getItem("user");
const savedToken = localStorage.getItem("token");

// Uygulama ilk açıldığında hafızanın başlangıç durumu.
const initialState: AuthState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
  loading: false,
  error: null,
};

// Kullanıcı adı ve şifreyle backend'e giriş isteği atan asenkron eylem.
export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials: LoginRequest, { rejectWithValue }) => {
      try {
        const response = await loginRequest(credentials);
        return response.data;
      } catch {
        // Şifre yanlışsa veya sunucu hata verirse kullanıcıya gösterilecek mesaj.
        return rejectWithValue("Kullanıcı adı veya şifre yanlış.");
      }
    },
);

// Yeni kullanıcı kaydı için backend'e istek atan asenkron eylem.
export const registerUser = createAsyncThunk(
    "auth/register",
    async (payload: RegisterRequest, { rejectWithValue }) => {
      try {
        const response = await registerRequest(payload);
        return response.data;
      } catch {
        return rejectWithValue("Kayıt sırasında hata oluştu.");
      }
    },
);

// Kimlik doğrulama durumunu yöneten ana Redux dilimi.
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Çıkış yapıldığında hem Redux hafızasını hem de tarayıcıdaki token/kullanıcı bilgisini sıfırlar.
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    // Sayfada kalan eski hata mesajını temizlemek için kullanılır.
    clearAuthError(state) {
      state.error = null;
    },
  },
  // Arka plandaki API isteklerinin durumuna (bekleniyor, başarılı, hatalı) göre hafızayı güncelleyen kısım.
  extraReducers: (builder) => {
    builder
        // Giriş isteği gönderildi: Yükleniyor durumunu aç, varsa eski hatayı sil.
        .addCase(loginUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        // Giriş başarılı: Gelen token ve kullanıcıyı hem Redux'a hem localStorage'a yaz.
        .addCase(loginUser.fulfilled, (state, action) => {
          state.loading = false;
          state.token = action.payload.token;
          state.user = {
            id: action.payload.userId,
            username: action.payload.username,
          };
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("user", JSON.stringify(state.user));
        })
        // Giriş başarısız: Yükleniyor durumunu kapat ve hata mesajını ekrana basılmak üzere kaydet.
        .addCase(loginUser.rejected, (state, action) => {
          state.loading = false;
          state.error = String(action.payload ?? "Giriş yapılamadı.");
        })
        // Kayıt isteği gönderildi: Yüklenme sürecini başlat.
        .addCase(registerUser.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        // Kayıt başarılı: Yüklenmeyi bitir.
        .addCase(registerUser.fulfilled, (state) => {
          state.loading = false;
        })
        // Kayıt başarısız: Hata mesajını hafızaya al.
        .addCase(registerUser.rejected, (state, action) => {
          state.loading = false;
          state.error = String(action.payload ?? "Kayıt yapılamadı.");
        });
  },
});

export const { clearAuthError, logout } = authSlice.actions;
export default authSlice.reducer;