import type { Priority, Todo } from "../../types";

export const FIELD_LIMIT = 255;
export type TodoForm = { title: string; description: string; priority: Priority; category: string; dueDate: string };
export type TodoSort = "default" | "title-asc" | "title-desc" | "priority-desc" | "priority-asc" | "created-desc" | "updated-desc" | "due-asc";
const PRIORITY_RANK: Record<Priority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

export function compareTodos(a: Todo, b: Todo, sort: TodoSort): number {
    const byTitle = () => a.title.localeCompare(b.title, "tr", { sensitivity: "base", numeric: true });
    const dateOrder = (left: string | null | undefined, right: string | null | undefined, descending = false) => {
        if (!left) return right ? 1 : 0;
        if (!right) return -1;
        return descending ? right.localeCompare(left) : left.localeCompare(right);
    };
    switch (sort) {
        case "created-desc": return dateOrder(a.createdAt, b.createdAt, true) || a.id - b.id;
        case "updated-desc": return dateOrder(a.updatedAt, b.updatedAt, true) || a.id - b.id;
        case "due-asc": return dateOrder(a.dueDate, b.dueDate) || byTitle() || a.id - b.id;
        case "title-asc": return byTitle() || a.id - b.id;
        case "title-desc": return -byTitle() || a.id - b.id;
        case "priority-desc": return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || byTitle() || a.id - b.id;
        case "priority-asc": return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byTitle() || a.id - b.id;
        default: return 0;
    }
}

export type FormErrors = Partial<Record<keyof TodoForm, string>>;

export function validateTodo(values: TodoForm): FormErrors {
    const errors: FormErrors = {};
    for (const [field, label] of [["title", "Başlık"], ["description", "Açıklama"], ["category", "Kategori"]] as const) {
        if (field !== "description" && !values[field].trim()) {
            errors[field] = label + " boş olamaz.";
        } else if (values[field].length > FIELD_LIMIT) {
            errors[field] = label + " en fazla 255 karakter olabilir.";
        }
    }
    if (values.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) errors.dueDate = "Ge\u00e7erli bir tarih se\u00e7in.";
    return errors;
}

export function matchesSearch(todo: Todo, query: string): boolean {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    return [todo.title, todo.description ?? ""].some((text) =>
        text.toLocaleLowerCase("tr-TR").includes(term)
    );
}

export function normalizeCategory(category: string) {
    return category.trim().replace(/\s+/g, " ");
}

export function categoryKey(category: string) {
    return normalizeCategory(category).toLocaleLowerCase("tr-TR");
}

export function matchesFilters(todo: Todo, query: string, category: string, priority: Priority | "") {
    return matchesSearch(todo, query) && (!category || categoryKey(todo.category) === categoryKey(category)) && (!priority || todo.priority === priority);
}

export function localDateKey() {
    const date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

