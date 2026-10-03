import axios from "axios";

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
  const token = localStorage.getItem("token");

  // Token varsa sunucuya 'Bearer <token>' formatında gönderiyoruz.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;