/**
 - Sistemdeki bir kullanıcının temel profil bilgilerini temsil eden model.
 */
export interface User {
  id: number;
  username: string;
  email: string;
}

/**
 - Görev önceliği için alınılabilecek sabit değerler kümesi.
 */
export type Priority = "LOW" | "MEDIUM" | "HIGH";

/**
 - Görev (Todo) nesnesinin veri yapısı.
 */
export interface Todo {
  id: number;
  title: string;
  description?: string; // İsteğe bağlıdır; görev eklerken açıklama boş bırakılabilir.
  completed: boolean;   // Görevin yapılıp yapılmadığını tutan mantıksal değer (true/false).
  dueDate?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;   // İsteğe bağlı; görevin oluşturulma zaman damgası.
  priority: Priority;   // Görevin öncelik seviyesi (LOW, MEDIUM, HIGH)
  category: string;     // Görevin ait olduğu kategori (örn: İş, Kişisel)
}

export type CreateTodoRequest = Pick<Todo, "title" | "description" | "priority" | "category" | "dueDate">;
export type UpdateTodoRequest = CreateTodoRequest & Pick<Todo, "completed">;

/**
 - Giriş yaparken kullanıcının girmesi zorunlu olan form verileri.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 - Yeni hesap oluştururken backend'e gönderilen kayıt formu verileri.
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 - Giriş işlemi başarılı olduğunda backend'in bize döneceği yanıt paketi.
 */
export interface LoginResponse {
  token: string;    // Sunucunun ürettiği dijital bilet (JWT).
  userId: number;   // Giriş yapan kullanıcının veritabanındaki ID numarası.
  username: string; // Kullanıcı adı.
}

/**
 - Görevler sayfasındaki filtreleme seçeneklerinin alabileceği sabit değerler kümesi.
 - Bu üç seçenek dışında herhangi bir değer girilmesini engeller.
 */
export type TodoFilter = "all" | "completed" | "pending";

export interface TodoPageQuery { page: number; size: number; search: string; category: string; priority: Priority | ""; sort: string }
export interface TodoPageResponse { items: Todo[]; page: number; size: number; totalElements: number; totalPages: number; total: number; completed: number; categories: string[] }
