import api from "./axios";
import type { Todo, TodoFilter } from "../types";

/**
 * Todo filtre tiplerine göre backend endpointlerini eşleştirir.
 *
 * Kullanıcı filtre seçtiğinde uygun API adresi otomatik olarak kullanılır.
 */
const filterPath: Record<TodoFilter, string> = {
  all: "/todos",
  completed: "/todos/completed",
  pending: "/todos/pending",
};

/**
 * Todo listesini getirir.
 *
 * Varsayılan olarak tüm Todo kayıtları alınır.
 * completed veya pending filtreleri seçildiğinde ilgili endpoint çağrılır.
 *
 * @param filter uygulanacak Todo filtresi
 * @returns Todo listesi
 */
export const getTodos = (filter: TodoFilter = "all") => {
  return api.get<Todo[]>(filterPath[filter]);
};

/**
 * Yeni bir Todo oluşturur.
 *
 * Frontend'den gönderilen başlık ve açıklama bilgileri
 * backend'e POST isteği olarak gönderilir.
 *
 * @param todo oluşturulacak Todo bilgileri
 * @returns oluşturulan Todo
 */
export const createTodo = (
    todo: Pick<Todo, "title" | "description">
) => {
  return api.post<Todo>("/todos", todo);
};

/**
 * Mevcut bir Todo kaydını günceller.
 *
 * Todo ID'si URL üzerinden,
 * güncellenecek bilgiler ise request body içerisinde gönderilir.
 *
 * @param id güncellenecek Todo ID'si
 * @param todo yeni Todo bilgileri
 * @returns güncellenmiş Todo
 */
export const updateTodo = (
    id: number,
    todo: Pick<Todo, "title" | "description" | "completed">
) => {
  return api.put<Todo>(`/todos/${id}`, todo);
};

/**
 * Todo'nun tamamlanma durumunu değiştirir.
 *
 * Eğer Todo tamamlanmamışsa tamamlanmış,
 * tamamlanmışsa tekrar tamamlanmamış hale getirilir.
 *
 * @param id durumu değiştirilecek Todo ID'si
 * @returns güncellenmiş Todo
 */
export const toggleTodo = (id: number) => {
  return api.put<Todo>(`/todos/${id}/toggle`);
};

/**
 * Belirtilen Todo kaydını siler.
 *
 * @param id silinecek Todo ID'si
 * @returns silme işleminin sonucu
 */
export const deleteTodo = (id: number) => {
  return api.delete<string>(`/todos/${id}`);
};