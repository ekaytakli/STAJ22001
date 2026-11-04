import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
    addTodo,
    fetchTodos,
    removeTodo,
    saveTodo,
    setFilter,
    switchTodoStatus,
} from "../store/todosSlice";
import { getTodos } from "../api/todoService";
import TodoStats from "../components/TodoStats";
import type { Priority, Todo, TodoFilter } from "../types";

const FIELD_LIMIT = 255;
type TodoForm = { title: string; description: string; priority: Priority; category: string; dueDate: string };
type TodoSort = "default" | "title-asc" | "title-desc" | "priority-desc" | "priority-asc" | "created-desc" | "updated-desc" | "due-asc";
const PRIORITY_RANK: Record<Priority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

function compareTodos(a: Todo, b: Todo, sort: TodoSort): number {
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

type FormErrors = Partial<Record<keyof TodoForm, string>>;

function validateTodo(values: TodoForm): FormErrors {
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

function FieldFeedback({ id, value, error }: { id: string; value: string; error?: string }) {
    return (
        <div id={id} className="small mb-2">
            {error && <div className="text-danger" role="alert">{error}</div>}
            <div className="text-muted text-end">{value.length}/{FIELD_LIMIT} karakter</div>
        </div>
    );
}

function matchesSearch(todo: Todo, query: string): boolean {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    return [todo.title, todo.description ?? ""].some((text) =>
        text.toLocaleLowerCase("tr-TR").includes(term)
    );
}

function normalizeCategory(category: string) {
    return category.trim().replace(/\s+/g, " ");
}

function categoryKey(category: string) {
    return normalizeCategory(category).toLocaleLowerCase("tr-TR");
}

function matchesFilters(todo: Todo, query: string, category: string, priority: Priority | "") {
    return matchesSearch(todo, query) && (!category || categoryKey(todo.category) === categoryKey(category)) && (!priority || todo.priority === priority);
}

function localDateKey() {
    const date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function TodoPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const user = useAppSelector((state) => state.auth.user);
    const {
        items: todos,
        filter,
        loading,
        activeMutationId,
        error,
        errorSource,
    } = useAppSelector((state) => state.todos);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
    const [sortOrder, setSortOrder] = useState<TodoSort>("default");
    const [knownCategories, setKnownCategories] = useState<string[]>([]);
    const categoryNames = new Map<string, string>();
    for (const category of ["Genel", ...knownCategories, ...todos.map((todo) => todo.category), categoryFilter]) {
        const name = normalizeCategory(category);
        if (name && !categoryNames.has(categoryKey(name))) categoryNames.set(categoryKey(name), name);
    }
    const categories = [...categoryNames.values()].sort((a, b) => a.localeCompare(b, "tr"));
    const canonicalCategory = (category: string) => categoryNames.get(categoryKey(category)) ?? normalizeCategory(category);
    const visibleTodos = todos.filter((todo) => matchesFilters(todo, searchQuery, categoryFilter, priorityFilter))
        .sort((a, b) => compareTodos(a, b, sortOrder));
    const hasListFilters = Boolean(searchQuery.trim() || categoryFilter || priorityFilter);

    const [today, setToday] = useState(() => localDateKey());
    useEffect(() => {
        const timer = window.setInterval(() => setToday(localDateKey()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    const busy = loading || activeMutationId !== null;

    useEffect(() => {
        if (busy || filter === "all") return;
        const controller = new AbortController();
        getTodos("all", controller.signal).then((response) => {
            if (!controller.signal.aborted) setKnownCategories(response.data.map((todo) => todo.category));
        }).catch(() => { /* Suggestions fall back to the visible tasks. */ });
        return () => controller.abort();
    }, [todos, filter, busy]);

    const [newTodo, setNewTodo] = useState<TodoForm>({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "Genel", dueDate: "",
    });

    const [editingId, setEditingId] = useState<number | null>(null);

    const [editTodo, setEditTodo] = useState<TodoForm>({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "Genel", dueDate: "",
    });

    const [createSubmitted, setCreateSubmitted] = useState(false);
    const [editSubmitted, setEditSubmitted] = useState(false);
    const createErrors = createSubmitted ? validateTodo(newTodo) : {};
    const editErrors = editSubmitted ? validateTodo(editTodo) : {};

    useEffect(() => {
        const request = dispatch(fetchTodos(filter));
        return () => request.abort();
    }, [dispatch, filter]);

    const originalTodo = todos.find((todo) => todo.id === editingId);
    const hasUnsavedChanges = Boolean(originalTodo && (
        editTodo.title !== originalTodo.title ||
        editTodo.description !== (originalTodo.description ?? "") ||
        editTodo.priority !== originalTodo.priority ||
        editTodo.category !== originalTodo.category ||
        editTodo.dueDate !== (originalTodo.dueDate ?? "")
    ));

    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const confirmDiscardChanges = () => !hasUnsavedChanges || window.confirm(
        "Kaydedilmemi\u015f de\u011fi\u015fiklikler var. De\u011fi\u015fikliklerden vazge\u00e7mek istiyor musunuz?"
    );

    const resetEditing = () => {
        setEditingId(null);
        setEditSubmitted(false);
        setEditTodo({ title: "", description: "", priority: "MEDIUM", category: "Genel", dueDate: "" });
    };

    const handleListFiltersChange = (query: string, category: string, priority: Priority | "") => {
        if (busy) return;
        if (originalTodo && !matchesFilters(originalTodo, query, category, priority)) {
            if (!confirmDiscardChanges()) return;
            resetEditing();
        }
        setSearchQuery(query);
        setCategoryFilter(category);
        setPriorityFilter(priority);
    };

    const handleSearchChange = (query: string) => handleListFiltersChange(query, categoryFilter, priorityFilter);

    const handleCancelEdit = () => {
        if (busy || !confirmDiscardChanges()) return;
        resetEditing();
    };

    const handleToggleTodo = async (id: number) => {
        if (busy || (editingId === id && !confirmDiscardChanges())) return;
        setSuccessMessage(null);
        const result = await dispatch(switchTodoStatus(id));
        if (switchTodoStatus.fulfilled.match(result)) {
            setSuccessMessage(result.payload.completed ? "G\u00f6rev tamamland\u0131." : "G\u00f6rev bekleyenlere ta\u015f\u0131nd\u0131.");
        }
        if (switchTodoStatus.fulfilled.match(result) && editingId === id) resetEditing();
    };

    const handleDeleteTodo = async (id: number) => {
        if (busy) return;
        const todo = todos.find((item) => item.id === id);
        if (!todo) return;

        const unsavedWarning = editingId === id && hasUnsavedChanges
            ? "\nKaydedilmemi\u015f de\u011fi\u015fiklikleriniz de silinecek."
            : "";
        const confirmed = window.confirm(
            '\u201c' + todo.title + '\u201d g\u00f6revini kal\u0131c\u0131 olarak silmek istiyor musunuz?'
            + "\nBu i\u015flem geri al\u0131namaz." + unsavedWarning
        );
        if (!confirmed) return;

        setSuccessMessage(null);
        const result = await dispatch(removeTodo(id));
        if (removeTodo.fulfilled.match(result)) setSuccessMessage("G\u00f6rev silindi.");
        if (removeTodo.fulfilled.match(result) && editingId === id) resetEditing();
    };

    const handleCreateTodo = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        setCreateSubmitted(true);
        if (Object.keys(validateTodo(newTodo)).length) return;

        setSuccessMessage(null);
        const result = await dispatch(addTodo({ ...newTodo, title: newTodo.title.trim(), category: canonicalCategory(newTodo.category), dueDate: newTodo.dueDate || null }));
        if (!addTodo.fulfilled.match(result)) return;
        setSuccessMessage("G\u00f6rev eklendi.");
        setCreateSubmitted(false);
        setNewTodo({ title: "", description: "", priority: "MEDIUM", category: "Genel", dueDate: "" });
    };

    const handleEditClick = (todo: Todo) => {
        if (busy || editingId === todo.id || !confirmDiscardChanges()) return;
        setEditSubmitted(false);
        setEditingId(todo.id);
        setEditTodo({
            title: todo.title,
            description: todo.description ?? "",
            priority: todo.priority,
            category: todo.category,
            dueDate: todo.dueDate ?? "",
        });
    };

    const handleUpdateTodo = async () => {
        if (busy || editingId === null) return;
        setEditSubmitted(true);
        if (Object.keys(validateTodo(editTodo)).length) return;
        const todo = todos.find((item) => item.id === editingId);
        if (!todo) return;

        setSuccessMessage(null);
        const result = await dispatch(
            saveTodo({
                id: editingId,
                todo: { ...todo, ...editTodo, title: editTodo.title.trim(), category: canonicalCategory(editTodo.category), dueDate: editTodo.dueDate || null },
            })
        );

        if (!saveTodo.fulfilled.match(result)) return;
        setSuccessMessage("G\u00f6rev g\u00fcncellendi.");
        resetEditing();
    };

    const handleFilterChange = (nextFilter: TodoFilter) => {
        if (busy || nextFilter === filter || !confirmDiscardChanges()) return;
        resetEditing();
        setSuccessMessage(null);
        dispatch(setFilter(nextFilter));
    };

    const handleLogout = () => {
        if (!confirmDiscardChanges()) return;
        dispatch(logout());
        navigate("/");
    };

    // Önceliğe göre rozet renklerini ayarlayan yardımcı fonksiyon
    const getPriorityBadgeStyle = (p: Priority) => {
        switch (p) {
            case "HIGH":
                return { background: "#fee2e2", color: "#991b1b" };
            case "MEDIUM":
                return { background: "#fef3c7", color: "#92400e" };
            case "LOW":
                return { background: "#dcfce7", color: "#166534" };
            default:
                return { background: "#f1f5f9", color: "#475569" };
        }
    };

    if (!user) return null;

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
                padding: "40px 15px",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            <div className="container" style={{ maxWidth: "760px" }}>
                <datalist id="todo-category-options">
                    {categories.map((category) => <option key={category} value={category} />)}
                </datalist>
                {/* Üst Karşılama ve Çıkış */}
                <div
                    className="d-flex justify-content-between align-items-center mb-4 p-3 px-4 rounded-4"
                    style={{
                        background: "#ffffff",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                    }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <h3 className="m-0" style={{ fontWeight: 700, color: "#1e293b", fontSize: "1.5rem" }}>
                            Merhaba, <span style={{ color: "#4f46e5" }}>{user.username}!</span>
                        </h3>
                        <span style={{ fontSize: "1.4rem" }}>👋</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn btn-sm px-3 py-2 rounded-3"
                        style={{ fontWeight: 600, color: "#ef4444", background: "#fee2e2", border: "none" }}
                    >
                        Çıkış Yap
                    </button>
                </div>

                <TodoStats todos={todos} filter={filter} busy={busy} listError={errorSource === "fetch" && Boolean(error)} />

                {/* Yeni Görev Ekleme Kutusu */}
                <div
                    className="rounded-4 mb-4 p-4"
                    style={{
                        background: "#ffffff",
                        boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.07)",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                    }}
                >
                    <h5 className="mb-3" style={{ fontWeight: 700, color: "#0f172a" }}>
                        ✨ Yeni Görev Ekle
                    </h5>

                    <form onSubmit={handleCreateTodo} noValidate>
                        <div className="mb-3">
                            <input disabled={busy}
                                type="text"
                                className="form-control rounded-3 py-2 px-3"
                                placeholder="Görev başlığı nedir?"
                                maxLength={FIELD_LIMIT}
                                aria-label="Başlık"
                                aria-invalid={Boolean(createErrors.title)}
                                aria-describedby="create-title-feedback"
                                value={newTodo.title}
                                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                                required
                                style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem" }}
                            />
                                <FieldFeedback id="create-title-feedback" value={newTodo.title} error={createErrors.title} />
                        </div>

                        <div className="mb-3">
                            <textarea disabled={busy}
                                className="form-control rounded-3 py-2 px-3"
                                placeholder="Ek detay veya notlar (isteğe bağlı)..."
                                rows={2}
                                maxLength={FIELD_LIMIT}
                                aria-label="Açıklama"
                                aria-invalid={Boolean(createErrors.description)}
                                aria-describedby="create-description-feedback"
                                value={newTodo.description}
                                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                                style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem", resize: "none" }}
                            />
                                <FieldFeedback id="create-description-feedback" value={newTodo.description} error={createErrors.description} />
                        </div>

                        {/* Öncelik ve Kategori Seçimi */}
                        <div className="mb-3 row g-2">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-muted">Öncelik</label>
                                <select disabled={busy}
                                    className="form-select rounded-3 py-2 px-3"
                                    value={newTodo.priority}
                                    onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as Priority })}
                                    style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem" }}
                                >
                                    <option value="LOW">🟢 Düşük</option>
                                    <option value="MEDIUM">🟡 Orta</option>
                                    <option value="HIGH">🔴 Yüksek</option>
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-muted">Kategori</label>
                                <input disabled={busy}
                                    type="text"
                                    className="form-control rounded-3 py-2 px-3"
                                    placeholder="Örn: İş, Kişisel"
                                    maxLength={FIELD_LIMIT}
                                list="todo-category-options"
                                aria-label="Kategori"
                                aria-invalid={Boolean(createErrors.category)}
                                aria-describedby="create-category-feedback"
                                value={newTodo.category}
                                    onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                                    style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem" }}
                                />
                                <FieldFeedback id="create-category-feedback" value={newTodo.category} error={createErrors.category} />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="create-due-date" className="form-label">Son teslim tarihi (isteğe bağlı)</label>
                            <input id="create-due-date" type="date" max="9999-12-31" className="form-control" disabled={busy}
                                value={newTodo.dueDate} onChange={(event) => setNewTodo({ ...newTodo, dueDate: event.target.value })}
                                aria-invalid={Boolean(createErrors.dueDate)} aria-describedby="create-due-error" />
                            {createErrors.dueDate && <p id="create-due-error" role="alert" className="text-danger small">{createErrors.dueDate}</p>}
                        </div>
                        <button disabled={busy}
                            type="submit"
                            className="btn text-white w-100 py-2 rounded-3"
                            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", fontWeight: 600, border: "none" }}
                        >
                            + Görevi Kaydet
                        </button>
                    </form>
                </div>

                {/* Filtre Butonları */}
                <div className="d-flex justify-content-center p-1 rounded-3 mb-4 mx-auto" style={{ background: "#e2e8f0", maxWidth: "360px" }}>
                    {([
                        { key: "all", label: "Tümü" },
                        { key: "pending", label: "Bekleyenler" },
                        { key: "completed", label: "Tamamlananlar" },
                    ] as const).map((tab) => (
                        <button disabled={busy}
                            key={tab.key}
                            onClick={() => handleFilterChange(tab.key)}
                            className="btn btn-sm flex-fill rounded-3 border-0 py-2"
                            style={{
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                color: filter === tab.key ? "#4f46e5" : "#64748b",
                                background: filter === tab.key ? "#ffffff" : "transparent",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="mb-4">
                    <label htmlFor="todo-search" className="form-label fw-semibold">Görev ara</label>
                    <div className="d-flex gap-2">
                        <input
                            id="todo-search"
                            type="search"
                            className="form-control rounded-3"
                            placeholder="Başlık veya açıklamada ara..."
                            value={searchQuery}
                            disabled={busy}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            aria-describedby="todo-search-summary"
                        />
                        {searchQuery && <button type="button" disabled={busy} className="btn btn-outline-secondary" onClick={() => handleSearchChange("")}>Temizle</button>}
                    </div>
                    <div className="row g-2 mt-2">
                        <div className="col-sm-6">
                            <label htmlFor="category-filter" className="form-label">Kategori</label>
                            <select id="category-filter" className="form-select" disabled={busy} value={categoryNames.get(categoryKey(categoryFilter)) ?? ""}
                                onChange={(event) => handleListFiltersChange(searchQuery, event.target.value, priorityFilter)}>
                                <option value="">Tüm kategoriler</option>
                                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </div>
                        <div className="col-sm-6">
                            <label htmlFor="priority-filter" className="form-label">Öncelik</label>
                            <select id="priority-filter" className="form-select" disabled={busy} value={priorityFilter}
                                onChange={(event) => handleListFiltersChange(searchQuery, categoryFilter, event.target.value as Priority | "")}>
                                <option value="">Tüm öncelikler</option>
                                <option value="HIGH">Yüksek</option>
                                <option value="MEDIUM">Orta</option>
                                <option value="LOW">Düşük</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-3">
                        <label htmlFor="todo-sort" className="form-label">Sıralama</label>
                        <select id="todo-sort" className="form-select" disabled={busy} value={sortOrder}
                            onChange={(event) => setSortOrder(event.target.value as TodoSort)}>
                            <option value="created-desc">En yeni oluşturulan</option>
                            <option value="updated-desc">Son güncellenen</option>
                            <option value="due-asc">Son teslim tarihi: en yakın</option>
                            <option value="default">Varsayılan sıra</option>
                            <option value="title-asc">Başlık: A → Z</option>
                            <option value="title-desc">Başlık: Z → A</option>
                            <option value="priority-desc">Öncelik: Yüksek → Düşük</option>
                            <option value="priority-asc">Öncelik: Düşük → Yüksek</option>
                        </select>
                    </div>
                    {hasListFilters && <button type="button" disabled={busy} className="btn btn-link btn-sm px-0 mt-2"
                        onClick={() => handleListFiltersChange("", "", "")}>Arama ve filtreleri temizle</button>}
                    <p id="todo-search-summary" role="status" className="small text-muted mt-2 mb-0">
                        {!loading && !error ? visibleTodos.length + " / " + todos.length + " g\u00f6rev g\u00f6steriliyor." : ""}
                    </p>
                </div>

                {successMessage && !error && !busy && (
                    <div role="status" className="alert alert-success rounded-3 py-2 px-3 small mb-3 d-flex justify-content-between align-items-center gap-2">
                        <span>{successMessage}</span>
                        <button type="button" className="btn-close" aria-label="Bildirimi kapat" onClick={() => setSuccessMessage(null)} />
                    </div>
                )}
                {activeMutationId && <p role="status" className="text-muted small">{"\u0130\u015flem s\u00fcr\u00fcyor..."}</p>}
                {error && (
                    <div role="alert" className="alert alert-danger rounded-3 py-2 px-3 small mb-3">
                        <p className="mb-2">{error}</p>
                        {errorSource === "fetch" ? (
                            <button type="button" disabled={busy} className="btn btn-outline-danger btn-sm" onClick={() => dispatch(fetchTodos(filter))}>
                                Yeniden dene
                            </button>
                        ) : <p className="mb-0">{"\u0130\u015flemi ilgili butondan tekrar deneyebilirsiniz."}</p>}
                    </div>
                )}
                {loading && (
                    <div className="text-center py-4" style={{ color: "#64748b" }}>
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Görevler yükleniyor...
                    </div>
                )}

                {!loading && !error && visibleTodos.length === 0 ? (
                    <div className="text-center py-5 rounded-4" style={{ background: "#ffffff", border: "2px dashed #cbd5e1", color: "#94a3b8" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📝</div>
                        <p className="m-0" style={{ fontWeight: 500 }}>{hasListFilters
                            ? "Arama ve filtrelere uygun g\u00f6rev bulunamad\u0131."
                            : filter === "pending"
                                ? "Bekleyen g\u00f6reviniz yok."
                                : filter === "completed"
                                    ? "Hen\u00fcz tamamlanan bir g\u00f6reviniz yok."
                                    : "Hen\u00fcz bir g\u00f6rev eklenmemi\u015f."}</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {visibleTodos.map((todo) => (
                            <div
                                key={todo.id}
                                className="p-3 rounded-4"
                                style={{
                                    background: todo.completed ? "#f8fafc" : "#ffffff",
                                    border: "1px solid",
                                    borderColor: todo.completed ? "#e2e8f0" : "#cbd5e1",
                                    opacity: todo.completed ? 0.75 : 1,
                                }}
                            >
                                {editingId === todo.id ? (
                                    <>
                                        <label htmlFor="edit-due-date" className="form-label">Son teslim tarihi</label>
                                        <input id="edit-due-date" type="date" max="9999-12-31" className="form-control mb-2" disabled={busy}
                                            value={editTodo.dueDate} onChange={(event) => setEditTodo({ ...editTodo, dueDate: event.target.value })}
                                            aria-invalid={Boolean(editErrors.dueDate)} aria-describedby="edit-due-error" />
                                        {editErrors.dueDate && <p id="edit-due-error" role="alert" className="text-danger small">{editErrors.dueDate}</p>}
                                        <input disabled={busy}
                                            type="text"
                                            className="form-control rounded-3 mb-2"
                                            maxLength={FIELD_LIMIT}
                                aria-label="Başlık"
                                aria-invalid={Boolean(editErrors.title)}
                                aria-describedby="edit-title-feedback"
                                value={editTodo.title}
                                            onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                                        />
                                <FieldFeedback id="edit-title-feedback" value={editTodo.title} error={editErrors.title} />
                                        <textarea disabled={busy}
                                            className="form-control rounded-3 mb-2"
                                            rows={2}
                                            maxLength={FIELD_LIMIT}
                                aria-label="Açıklama"
                                aria-invalid={Boolean(editErrors.description)}
                                aria-describedby="edit-description-feedback"
                                value={editTodo.description}
                                            onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
                                        />
                                <FieldFeedback id="edit-description-feedback" value={editTodo.description} error={editErrors.description} />
                                        <div className="row g-2 mb-2">
                                            <div className="col-6">
                                                <select disabled={busy}
                                                    className="form-select form-select-sm"
                                                    value={editTodo.priority}
                                                    onChange={(e) => setEditTodo({ ...editTodo, priority: e.target.value as Priority })}
                                                >
                                                    <option value="LOW">Düşük</option>
                                                    <option value="MEDIUM">Orta</option>
                                                    <option value="HIGH">Yüksek</option>
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <input disabled={busy}
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    maxLength={FIELD_LIMIT}
                                aria-label="Kategori"
                                aria-invalid={Boolean(editErrors.category)}
                                aria-describedby="edit-category-feedback"
                                list="todo-category-options"
                                value={editTodo.category}
                                                    onChange={(e) => setEditTodo({ ...editTodo, category: e.target.value })}
                                                    placeholder="Kategori"
                                                />
                                <FieldFeedback id="edit-category-feedback" value={editTodo.category} error={editErrors.category} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="d-flex align-items-start justify-content-between gap-3">
                                        <div className="flex-grow-1">
                                            <h5
                                                className="m-0 mb-1"
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: "1.05rem",
                                                    color: todo.completed ? "#94a3b8" : "#1e293b",
                                                    textDecoration: todo.completed ? "line-through" : "none",
                                                }}
                                            >
                                                {todo.title}
                                            </h5>
                                            <div className="small text-muted mb-2">
                                                {todo.createdAt && <div>Oluşturulma: {new Date(todo.createdAt).toLocaleString("tr-TR")}</div>}
                                                {todo.updatedAt && <div>Güncellenme: {new Date(todo.updatedAt).toLocaleString("tr-TR")}</div>}
                                                {todo.dueDate && <div className={!todo.completed && todo.dueDate < today ? "text-danger fw-semibold" : ""}>
                                                    Son teslim: {new Date(todo.dueDate + "T00:00:00").toLocaleDateString("tr-TR")}
                                                    {!todo.completed && todo.dueDate < today && " (Gecikti)"}
                                                </div>}
                                            </div>
                                            {todo.description && (
                                                <p
                                                    className="m-0 small mb-2"
                                                    style={{ color: todo.completed ? "#cbd5e1" : "#64748b", textDecoration: todo.completed ? "line-through" : "none" }}
                                                >
                                                    {todo.description}
                                                </p>
                                            )}

                                            {/* Kategori ve Öncelik Etiketleri */}
                                            <div className="d-flex gap-2 align-items-center">
                                                <span className="badge rounded-pill px-2.5 py-1" style={{ background: "#e2e8f0", color: "#334155", fontSize: "0.75rem" }}>
                                                    📁 {todo.category || "Genel"}
                                                </span>
                                                <span className="badge rounded-pill px-2.5 py-1" style={{ fontSize: "0.75rem", ...getPriorityBadgeStyle(todo.priority) }}>
                                                    {todo.priority === "HIGH" ? "🔴 Yüksek" : todo.priority === "MEDIUM" ? "🟡 Orta" : "🟢 Düşük"}
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className="badge rounded-pill px-3 py-2"
                                            style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                background: todo.completed ? "#dcfce7" : "#fef3c7",
                                                color: todo.completed ? "#15803d" : "#b45309",
                                            }}
                                        >
                                            {todo.completed ? "Tamamlandı" : "Bekliyor"}
                                        </span>
                                    </div>
                                )}

                                <div className="mt-3 pt-2 d-flex justify-content-end gap-2 border-top border-light">
                                    <button disabled={busy}
                                        onClick={() => handleToggleTodo(todo.id)}
                                        className="btn btn-sm rounded-3 px-3"
                                        style={{
                                            fontWeight: 600,
                                            background: todo.completed ? "#f1f5f9" : "#e0e7ff",
                                            color: todo.completed ? "#475569" : "#4338ca",
                                            border: "none",
                                        }}
                                    >
                                        {todo.completed ? "↩ Geri Al" : "✓ Tamamla"}
                                    </button>

                                    {editingId === todo.id ? (
                                        <>
                                            <button disabled={busy} className="btn btn-outline-secondary btn-sm rounded-3 px-3" onClick={handleCancelEdit}>
                                                {"\u0130ptal"}
                                            </button>
                                            <button disabled={busy} className="btn btn-primary btn-sm rounded-3 px-3" onClick={handleUpdateTodo}>
                                                Kaydet
                                            </button>
                                        </>
                                    ) : (
                                        <button disabled={busy}
                                            className="btn btn-sm rounded-3 px-3"
                                            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}
                                            onClick={() => handleEditClick(todo)}
                                        >
                                            Düzenle
                                        </button>
                                    )}

                                    <button disabled={busy}
                                        className="btn btn-sm rounded-3 px-3"
                                        style={{ background: "#fef2f2", border: "none", color: "#ef4444" }}
                                        onClick={() => handleDeleteTodo(todo.id)}
                                    >
                                        Sil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TodoPage;