/**
 * Sistemdeki bir kullanıcının temel profil bilgilerini temsil eden model.
 */
export interface User {
  id: number;
  username: string;
  email: string;
}

/**
 * Görev (Todo) nesnesinin veri yapısı.
 */
export interface Todo {
  id: number;
  title: string;
  description?: string; // İsteğe bağlıdır; görev eklerken açıklama boş bırakılabilir.
  completed: boolean;   // Görevin yapılıp yapılmadığını tutan mantıksal değer (true/false).
  createdAt?: string;   // İsteğe bağlı; görevin oluşturulma zaman damgası.
}

/**
 * Giriş yaparken kullanıcının girmesi zorunlu olan form verileri.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Yeni hesap oluştururken backend'e gönderilen kayıt formu verileri.
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Giriş işlemi başarılı olduğunda backend'in bize döneceği yanıt paketi.
 */
export interface LoginResponse {
  token: string;    // Sunucunun ürettiği dijital bilet (JWT).
  userId: number;   // Giriş yapan kullanıcının veritabanındaki ID numarası.
  username: string; // Kullanıcı adı.
}

/**
 * Görevler sayfasındaki filtreleme seçeneklerinin alabileceği sabit değerler kümesi.
 * Bu üç seçenek dışında herhangi bir değer girilmesini engeller.
 */
export type TodoFilter = "all" | "completed" | "pending";