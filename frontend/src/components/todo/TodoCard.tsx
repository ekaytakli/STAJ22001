import type { Priority, Todo } from "../../types";
import type { Dispatch, SetStateAction, RefObject } from "react";
import type { TodoForm, FormErrors } from "./todoHelpers";
import { FIELD_LIMIT } from "./todoHelpers";
import FieldFeedback from "./FieldFeedback";

type Props = {
    todo: Todo;
    busy: boolean;
    editingId: number | null;
    editTodo: TodoForm;
    setEditTodo: Dispatch<SetStateAction<TodoForm>>;
    editErrors: FormErrors;
    editTitleRef: RefObject<HTMLInputElement | null>;
    today: string;
    handleToggleTodo: (id: number) => void;
    handleCancelEdit: () => void;
    handleUpdateTodo: () => void;
    handleEditClick: (todo: Todo) => void;
    handleDeleteTodo: (id: number) => void;
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


export default function TodoCard({ todo, busy, editingId, editTodo, setEditTodo, editErrors, editTitleRef, today, handleToggleTodo, handleCancelEdit, handleUpdateTodo, handleEditClick, handleDeleteTodo }: Props) {
    return (<>
                            <div
                                className="p-3 rounded-4"
                                style={{
                                    background: todo.completed ? "#f8fafc" : "#ffffff",
                                    border: "1px solid",
                                    borderColor: todo.completed ? "#e2e8f0" : "#cbd5e1",

                                }}
                            >
                                {editingId === todo.id ? (
                                    <>
                                        <label htmlFor="edit-due-date" className="form-label">Son teslim tarihi</label>
                                        <input id="edit-due-date" type="date" max="9999-12-31" className="form-control mb-2" disabled={busy}
                                            value={editTodo.dueDate} onChange={(event) => setEditTodo({ ...editTodo, dueDate: event.target.value })}
                                            aria-invalid={Boolean(editErrors.dueDate)} aria-describedby="edit-due-error" />
                                        {editErrors.dueDate && <p id="edit-due-error" role="alert" className="text-danger small">{editErrors.dueDate}</p>}
                                        <label htmlFor="edit-title" className="form-label small fw-semibold">Başlık</label>
                                <input disabled={busy}
                                            type="text"
                                            className="form-control rounded-3 mb-2"
                                            maxLength={FIELD_LIMIT}
                                aria-label="Başlık"
                                aria-invalid={Boolean(editErrors.title)}
                                aria-describedby="edit-title-feedback"
                                ref={editTitleRef}
                                id="edit-title"
                                value={editTodo.title}
                                            onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                                        />
                                <FieldFeedback id="edit-title-feedback" value={editTodo.title} error={editErrors.title} />
                                        <label htmlFor="edit-description" className="form-label small fw-semibold">Açıklama (isteğe bağlı)</label>
                                <textarea disabled={busy}
                                            className="form-control rounded-3 mb-2"
                                            rows={2}
                                            maxLength={FIELD_LIMIT}
                                aria-label="Açıklama"
                                aria-invalid={Boolean(editErrors.description)}
                                aria-describedby="edit-description-feedback"
                                id="edit-description"
                                value={editTodo.description}
                                            onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
                                        />
                                <FieldFeedback id="edit-description-feedback" value={editTodo.description} error={editErrors.description} />
                                        <div className="row g-2 mb-2">
                                            <div className="col-12 col-sm-6">
                                                <label htmlFor="edit-priority" className="form-label small fw-semibold">Öncelik</label>
                                <select disabled={busy}
                                                    className="form-select form-select-sm"
                                                    id="edit-priority"
                                value={editTodo.priority}
                                                    onChange={(e) => setEditTodo({ ...editTodo, priority: e.target.value as Priority })}
                                                >
                                                    <option value="LOW">Düşük</option>
                                                    <option value="MEDIUM">Orta</option>
                                                    <option value="HIGH">Yüksek</option>
                                                </select>
                                            </div>
                                            <div className="col-6">
                                                <label htmlFor="edit-category" className="form-label small fw-semibold">Kategori</label>
                                <input disabled={busy}
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    maxLength={FIELD_LIMIT}
                                aria-label="Kategori"
                                aria-invalid={Boolean(editErrors.category)}
                                aria-describedby="edit-category-feedback"
                                list="todo-category-options"
                                id="edit-category"
                                value={editTodo.category}
                                                    onChange={(e) => setEditTodo({ ...editTodo, category: e.target.value })}
                                                    placeholder="Kategori"
                                                />
                                <FieldFeedback id="edit-category-feedback" value={editTodo.category} error={editErrors.category} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="todo-card-content d-flex align-items-start justify-content-between gap-3">
                                        <div className="flex-grow-1">
                                            <h5
                                                className="m-0 mb-1"
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: "1.05rem",
                                                    color: todo.completed ? "#475569" : "#1e293b",
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
                                                    style={{ color: "#64748b", textDecoration: todo.completed ? "line-through" : "none" }}
                                                >
                                                    {todo.description}
                                                </p>
                                            )}

                                            {/* Kategori ve Öncelik Etiketleri */}
                                            <div className="d-flex flex-wrap gap-2 align-items-center">
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

                                <div className="todo-actions mt-3 pt-2 d-flex flex-wrap justify-content-end gap-2 border-top border-light">
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
                                            id={"edit-button-" + todo.id}
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

    </>);
}
