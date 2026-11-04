import "./TodoPage.css";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
    addTodo,
    fetchTodos,
    removeTodo,
    saveTodo,
    setFilter,
    setQuery,
    switchTodoStatus,
} from "../store/todosSlice";
import TodoStats from "../components/TodoStats";
import { validateTodo, normalizeCategory, categoryKey, localDateKey } from "../components/todo/todoHelpers";
import type { TodoForm, TodoSort, FormErrors } from "../components/todo/todoHelpers";
import TodoCreateForm from "../components/todo/TodoCreateForm";
import TodoFilters from "../components/todo/TodoFilters";
import TodoCard from "../components/todo/TodoCard";
import type { Priority, Todo, TodoFilter } from "../types";

function TodoPage() {
    const editTitleRef = useRef<HTMLInputElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
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
        query, pageData, revision,
    } = useAppSelector((state) => state.todos);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { search: searchQuery, category: categoryFilter, priority: priorityFilter } = query;
    const sortOrder = query.sort as TodoSort;
    const knownCategories = pageData?.categories ?? [];
    const categoryNames = new Map<string, string>();
    for (const category of ["Genel", ...knownCategories, ...todos.map((todo) => todo.category), categoryFilter]) {
        const name = normalizeCategory(category);
        if (name && !categoryNames.has(categoryKey(name))) categoryNames.set(categoryKey(name), name);
    }
    const categories = [...categoryNames.values()].sort((a, b) => a.localeCompare(b, "tr"));
    const canonicalCategory = (category: string) => categoryNames.get(categoryKey(category)) ?? normalizeCategory(category);
    const visibleTodos = todos;
    const hasListFilters = Boolean(searchQuery.trim() || categoryFilter || priorityFilter);

    const [today, setToday] = useState(() => localDateKey());
    useEffect(() => {
        const timer = window.setInterval(() => setToday(localDateKey()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    const busy = loading || activeMutationId !== null;

    const [newTodo, setNewTodo] = useState<TodoForm>({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "Genel", dueDate: "",
    });

    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        if (editingId !== null) editTitleRef.current?.focus();
    }, [editingId]);

    const focusFirstError = (prefix: string, errors: FormErrors) => {
        const field = Object.keys(errors)[0];
        window.requestAnimationFrame(() => pageRef.current?.querySelector<HTMLElement>("#" + prefix + "-" + (field === "dueDate" ? "due-date" : field))?.focus());
    };

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
        const request = dispatch(fetchTodos());
        return () => request.abort();
    }, [dispatch, filter, query, revision]);

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
        if (activeMutationId !== null) return;
        if (originalTodo) {
            if (!confirmDiscardChanges()) return;
            resetEditing();
        }
        dispatch(setQuery({ search: query, category, priority }));
    };

    const handleSortChange = (sort: TodoSort) => {
        if (busy || !confirmDiscardChanges()) return;
        resetEditing();
        dispatch(setQuery({ sort }));
    };
    const handlePagination = (page: number, size = query.size) => {
        if (busy || !confirmDiscardChanges()) return;
        resetEditing();
        dispatch(setQuery({ page, size }));
    };

    const handleSearchChange = (query: string) => handleListFiltersChange(query, categoryFilter, priorityFilter);

    const handleCancelEdit = () => {
        if (busy || !confirmDiscardChanges()) return;
        const previousId = editingId;
        resetEditing();
        window.requestAnimationFrame(() => document.getElementById("edit-button-" + previousId)?.focus());
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
        const errors = validateTodo(newTodo);
        if (Object.keys(errors).length) {
            focusFirstError("create", errors);
            return;
        }

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
        const errors = validateTodo(editTodo);
        if (Object.keys(errors).length) {
            focusFirstError("edit", errors);
            return;
        }
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

    if (!user) return null;

    return (
        <div ref={pageRef} className="todo-page"
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
                    className="todo-header d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4 p-3 px-4 rounded-4"
                    style={{
                        background: "#ffffff",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                    }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <h1 className="m-0" style={{ fontWeight: 700, color: "#1e293b", fontSize: "1.5rem" }}>
                            Merhaba, <span style={{ color: "#4f46e5" }}>{user.username}!</span>
                        </h1>
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

                <TodoStats total={pageData?.total ?? 0} completed={pageData?.completed ?? 0} busy={busy} listError={errorSource === "fetch" && Boolean(error)} />

                <TodoCreateForm busy={busy} newTodo={newTodo} setNewTodo={setNewTodo} createErrors={createErrors} handleCreateTodo={handleCreateTodo} />

                <TodoFilters searchBusy={activeMutationId !== null} busy={busy} filter={filter} handleFilterChange={handleFilterChange} searchQuery={searchQuery} handleSearchChange={handleSearchChange} categoryFilter={categoryFilter} categoryNames={categoryNames} categories={categories} priorityFilter={priorityFilter} handleListFiltersChange={handleListFiltersChange} sortOrder={sortOrder} setSortOrder={handleSortChange} hasListFilters={hasListFilters} loading={loading} error={error} visibleTodos={visibleTodos} totalElements={pageData?.totalElements ?? 0} />

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
                            <button type="button" disabled={busy} className="btn btn-outline-danger btn-sm" onClick={() => dispatch(fetchTodos())}>
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
                            <TodoCard key={todo.id} todo={todo} busy={busy} editingId={editingId} editTodo={editTodo} setEditTodo={setEditTodo} editErrors={editErrors} editTitleRef={editTitleRef} today={today} handleToggleTodo={handleToggleTodo} handleCancelEdit={handleCancelEdit} handleUpdateTodo={handleUpdateTodo} handleEditClick={handleEditClick} handleDeleteTodo={handleDeleteTodo} />
                        ))}
                    </div>
                )}
                <nav aria-label="Görev sayfaları" className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4">
                    <div className="d-flex align-items-center gap-2">
                        <label htmlFor="page-size">Sayfa boyutu</label>
                        <select id="page-size" className="form-select w-auto" value={query.size} disabled={busy}
                            onChange={(event) => handlePagination(0, Number(event.target.value))}>
                            {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </div>
                    <span role="status">{(pageData?.page ?? 0) + 1} / {Math.max(1, pageData?.totalPages ?? 0)}</span>
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary" disabled={busy || !pageData || pageData.page === 0}
                            onClick={() => handlePagination((pageData?.page ?? 0) - 1)}>Önceki</button>
                        <button className="btn btn-outline-primary" disabled={busy || !pageData || pageData.page + 1 >= pageData.totalPages}
                            onClick={() => handlePagination((pageData?.page ?? 0) + 1)}>Sonraki</button>
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default TodoPage;