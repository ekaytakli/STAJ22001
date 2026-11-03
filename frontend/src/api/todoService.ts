import api from "./axios";
import type { Todo, TodoFilter, CreateTodoRequest, UpdateTodoRequest } from "../types";

// Filtre butonlarına göre hangi API yoluna gidileceğini belirleyen sözlük.
const filterPath: Record<TodoFilter, string> = {
  all: "/todos",
  completed: "/todos/completed",
  pending: "/todos/pending",
};

// Seçilen filtreye göre görevleri backend'den çeker (Varsayılan: Tümü).
export const getTodos = (filter: TodoFilter = "all", signal?: AbortSignal) => {
  return api.get<Todo[]>(filterPath[filter], { signal });
};

// Yeni bir görev ekler. Artık priority ve category alanlarını da destekliyor.
export const createTodo = (
    todo: CreateTodoRequest
) => {
  return api.post<Todo>("/todos", todo);
};

// Seçilen görevin bilgilerini günceller (öncelik, kategori ve tamamlanma durumu dahil).
export const updateTodo = (
    id: number,
    todo: UpdateTodoRequest
) => {
  return api.put<Todo>(`/todos/${id}`, todo);
};

// Görevin durumunu tersine çevirir (Yapıldıysa yapılmadı, yapılmadıysa yapıldı yapar).
export const toggleTodo = (id: number) => {
  return api.put<Todo>(`/todos/${id}/toggle`);
};

// Görevi ID numarasına göre kalıcı olarak veritabanından siler.
export const deleteTodo = (id: number) => {
  return api.delete<void>(`/todos/${id}`);
};