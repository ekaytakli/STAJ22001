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
import type { Priority, Todo, TodoFilter } from "../types";

function TodoPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const user = useAppSelector((state) => state.auth.user);
    const {
        items: todos,
        filter,
        loading,
        error,
    } = useAppSelector((state) => state.todos);

    const [newTodo, setNewTodo] = useState<{
        title: string;
        description: string;
        priority: Priority;
        category: string;
    }>({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "Genel",
    });

    const [editingId, setEditingId] = useState<number | null>(null);

    const [editTodo, setEditTodo] = useState<{
        title: string;
        description: string;
        priority: Priority;
        category: string;
    }>({
        title: "",
        description: "",
        priority: "MEDIUM",
        category: "Genel",
    });

    useEffect(() => {
        dispatch(fetchTodos(filter));
    }, [dispatch, filter]);

    const handleCreateTodo = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!newTodo.title.trim()) return;

        await dispatch(addTodo(newTodo));
        setNewTodo({ title: "", description: "", priority: "MEDIUM", category: "Genel" });
        dispatch(fetchTodos(filter));
    };

    const handleEditClick = (todo: Todo) => {
        setEditingId(todo.id);
        setEditTodo({
            title: todo.title,
            description: todo.description ?? "",
            priority: todo.priority,
            category: todo.category,
        });
    };

    const handleUpdateTodo = async () => {
        if (editingId === null) return;
        const todo = todos.find((item) => item.id === editingId);
        if (!todo) return;

        await dispatch(
            saveTodo({
                id: editingId,
                todo: { ...todo, ...editTodo },
            })
        );

        setEditingId(null);
        dispatch(fetchTodos(filter));
    };

    const handleFilterChange = (nextFilter: TodoFilter) => {
        dispatch(setFilter(nextFilter));
    };

    const handleLogout = () => {
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

                    <form onSubmit={handleCreateTodo}>
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control rounded-3 py-2 px-3"
                                placeholder="Görev başlığı nedir?"
                                value={newTodo.title}
                                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                                required
                                style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem" }}
                            />
                        </div>

                        <div className="mb-3">
                            <textarea
                                className="form-control rounded-3 py-2 px-3"
                                placeholder="Ek detay veya notlar (isteğe bağlı)..."
                                rows={2}
                                value={newTodo.description}
                                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                                style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem", resize: "none" }}
                            />
                        </div>

                        {/* Öncelik ve Kategori Seçimi */}
                        <div className="mb-3 row g-2">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold text-muted">Öncelik</label>
                                <select
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
                                <input
                                    type="text"
                                    className="form-control rounded-3 py-2 px-3"
                                    placeholder="Örn: İş, Kişisel"
                                    value={newTodo.category}
                                    onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                                    style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem" }}
                                />
                            </div>
                        </div>

                        <button
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
                        <button
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

                {error && <div className="alert alert-danger rounded-3 py-2 px-3 small mb-3">{error}</div>}
                {loading && (
                    <div className="text-center py-4" style={{ color: "#64748b" }}>
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Görevler yükleniyor...
                    </div>
                )}

                {!loading && todos.length === 0 ? (
                    <div className="text-center py-5 rounded-4" style={{ background: "#ffffff", border: "2px dashed #cbd5e1", color: "#94a3b8" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📝</div>
                        <p className="m-0" style={{ fontWeight: 500 }}>Henüz bir görev eklenmemiş.</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {todos.map((todo) => (
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
                                        <input
                                            type="text"
                                            className="form-control rounded-3 mb-2"
                                            value={editTodo.title}
                                            onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                                        />
                                        <textarea
                                            className="form-control rounded-3 mb-2"
                                            rows={2}
                                            value={editTodo.description}
                                            onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
                                        />
                                        <div className="row g-2 mb-2">
                                            <div className="col-6">
                                                <select
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
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={editTodo.category}
                                                    onChange={(e) => setEditTodo({ ...editTodo, category: e.target.value })}
                                                    placeholder="Kategori"
                                                />
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
                                    <button
                                        onClick={() => dispatch(switchTodoStatus(todo.id))}
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
                                        <button className="btn btn-primary btn-sm rounded-3 px-3" onClick={handleUpdateTodo}>
                                            Kaydet
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-sm rounded-3 px-3"
                                            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" }}
                                            onClick={() => handleEditClick(todo)}
                                        >
                                            Düzenle
                                        </button>
                                    )}

                                    <button
                                        className="btn btn-sm rounded-3 px-3"
                                        style={{ background: "#fef2f2", border: "none", color: "#ef4444" }}
                                        onClick={() => dispatch(removeTodo(todo.id))}
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