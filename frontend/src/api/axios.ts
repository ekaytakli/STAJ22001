import axios from "axios";
import { getSessionToken } from "../store/session";

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// Backend ile haberleşecek ana kuryemiz (Axios nesnesi).
// Her istekte temel adresi ve ayarları baştan yazmamak için ortak bir merkez oluşturuyoruz.
const api = axios.create({
  // Canlıdaysak sunucu adresini çevresel değişkenden al, yoksa bilgisayardaki (localhost) backend'e git.
  baseURL:
      import.meta.env.VITE_API_URL ??
      "http://localhost:8080/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// İstek çıkmadan hemen önce araya giren kontrolcü (Interceptor).
// Kullanıcı giriş yaptıysa, cebindeki bileti (JWT token) isteğin üzerine iliştirir.
api.interceptors.request.use((config) => {
  const token = getSessionToken();

  // Token varsa sunucuya 'Bearer <token>' formatında gönderiyoruz.
  if (token && !config.url?.startsWith("/auth/")) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  const token = getSessionToken();
  // Önceki oturumun geciken 401 yanıtı yeni oturumu kapatmamalıdır.
  if (axios.isAxiosError(error) && error.response?.status === 401 && token
      && error.config?.headers.Authorization === `Bearer ${token}`) {
    onUnauthorized();
  }
  return Promise.reject(error);
});

export default api;
