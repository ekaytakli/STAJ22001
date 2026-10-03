import api from "./axios";
import type { Todo, TodoFilter } from "../types";

// Filtre butonlarına göre hangi API yoluna gidileceğini belirleyen sözlük.
const filterPath: Record<TodoFilter, string> = {
  all: "/todos",
  completed: "/todos/completed",
  pending: "/todos/pending",
};

// Seçilen filtreye göre görevleri backend'den çeker (Varsayılan: Tümü).
export const getTodos = (filter: TodoFilter = "all") => {
  return api.get<Todo[]>(filterPath[filter]);
};

// Yeni bir görev ekler. Sadece başlık ve açıklama göndermemiz yeterlidir.
export const createTodo = (
    todo: Pick<Todo, "title" | "description">
) => {
  return api.post<Todo>("/todos", todo);
};

// Seçilen görevin başlığını veya açıklamasını günceller.
export const updateTodo = (
    id: number,
    todo: Pick<Todo, "title" | "description" | "completed">
) => {
  return api.put<Todo>(`/todos/${id}`, todo);
};

// Görevin durumunu tersine çevirir (Yapıldıysa yapılmadı, yapılmadıysa yapıldı yapar).
export const toggleTodo = (id: number) => {
  return api.put<Todo>(`/todos/${id}/toggle`);
};

// Görevi ID numarasına göre kalıcı olarak veritabanından siler.
export const deleteTodo = (id: number) => {
  return api.delete<string>(`/todos/${id}`);
};