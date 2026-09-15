import axios from "axios";

/**
 * Uygulamanın backend ile yaptığı tüm HTTP isteklerinde
 * kullanılacak ortak Axios nesnesini oluşturur.
 *
 * Bu yapı sayesinde her API dosyasında tekrar tekrar
 * backend adresi ve header tanımlamaya gerek kalmaz.
 */
const api = axios.create({
  /**
   * Backend API adresi environment variable üzerinden alınır.
   *
   * Production ortamında VITE_API_URL kullanılır.
   * Değer tanımlı değilse local geliştirme adresi kullanılır.
   */
  baseURL:
      import.meta.env.VITE_API_URL ??
      "http://localhost:8080/api",

  /**
   * Backend'e gönderilen verilerin JSON formatında olduğunu belirtir.
   */
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Her HTTP isteği backend'e gönderilmeden önce çalışan interceptor'dır.
 *
 * Kullanıcı giriş yaptıysa JWT localStorage içerisinde saklanır.
 * Buradaki interceptor tokenı otomatik olarak Authorization header'a ekler.
 *
 * Böylece her API isteğinde tokenı manuel olarak yazmaya gerek kalmaz.
 */
api.interceptors.request.use((config) => {
  /**
   * Daha önce localStorage'a kaydedilmiş JWT alınır.
   */
  const token = localStorage.getItem("token");

  /**
   * Token varsa backend'e Bearer formatında gönderilir.
   *
   * Örnek:
   * Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
   */
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * Güncellenen Axios yapılandırması isteğin devam etmesi için döndürülür.
   */
  return config;
});

export default api;