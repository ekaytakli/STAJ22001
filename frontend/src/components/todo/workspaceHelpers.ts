import type { Todo } from "../../types";
import type { TodoForm } from "./todoHelpers";

export const emptyDraft = (): TodoForm => ({
  title: "", description: "", priority: "MEDIUM", category: "Genel", dueDate: "",
});

export function hasDraft(form: TodoForm): boolean {
  return Boolean(form.title || form.description || form.dueDate ||
    form.category !== "Genel" || form.priority !== "MEDIUM");
}

// Treat browser storage as untrusted input and never restore another user's draft.
export function readDraft(userId: number): TodoForm {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(`odak:draft:${userId}`) ?? "null");
    if (!value || typeof value !== "object") return emptyDraft();
    const form = value as Record<string, unknown>;
    if (!["title", "description", "category", "dueDate"].every(
      (key) => typeof form[key] === "string" && (form[key] as string).length <= 255,
    ) || !["LOW", "MEDIUM", "HIGH"].includes(String(form.priority))) return emptyDraft();
    return { title: form.title as string, description: form.description as string,
      category: form.category as string, dueDate: form.dueDate as string,
      priority: form.priority as TodoForm["priority"] };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(userId: number, form: TodoForm): boolean {
  try {
    const key = `odak:draft:${userId}`;
    if (hasDraft(form)) sessionStorage.setItem(key, JSON.stringify(form));
    else sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// Quote every cell; neutralize spreadsheet formulas, including after whitespace.
function csvCell(value: string): string {
  const safe = /^[\s]*[=+@-]/u.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export function todosToCsv(todos: Todo[]): string {
  const priorities = { HIGH: "Yüksek", MEDIUM: "Orta", LOW: "Düşük" };
  const rows = [
    ["Başlık", "Açıklama", "Durum", "Öncelik", "Kategori", "Son teslim tarihi", "Oluşturulma", "Güncellenme"],
    ...todos.map((todo) => [todo.title, todo.description ?? "",
      todo.completed ? "Tamamlandı" : "Bekliyor", priorities[todo.priority],
      todo.category, todo.dueDate ?? "", todo.createdAt ?? "", todo.updatedAt ?? ""]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}

export function remainingSeconds(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}
