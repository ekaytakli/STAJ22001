import type { Priority } from "../../types";
import type { Dispatch, SetStateAction, FormEvent } from "react";
import type { TodoForm, FormErrors } from "./todoHelpers";
import { FIELD_LIMIT } from "./todoHelpers";
import FieldFeedback from "./FieldFeedback";

type Props = {
    busy: boolean;
    newTodo: TodoForm;
    setNewTodo: Dispatch<SetStateAction<TodoForm>>;
    createErrors: FormErrors;
    handleCreateTodo: (event: FormEvent<HTMLFormElement>) => void;
};


export default function TodoCreateForm({ busy, newTodo, setNewTodo, createErrors, handleCreateTodo }: Props) {
    return (<>
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
                            <label htmlFor="create-title" className="form-label small fw-semibold">Başlık</label>
                                <input disabled={busy}
                                type="text"
                                className="form-control rounded-3 py-2 px-3"
                                placeholder="Görev başlığı nedir?"
                                maxLength={FIELD_LIMIT}
                                aria-label="Başlık"
                                aria-invalid={Boolean(createErrors.title)}
                                aria-describedby="create-title-feedback"
                                id="create-title"
                                value={newTodo.title}
                                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                                required
                                style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem" }}
                            />
                                <FieldFeedback id="create-title-feedback" value={newTodo.title} error={createErrors.title} />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="create-description" className="form-label small fw-semibold">Açıklama (isteğe bağlı)</label>
                                <textarea disabled={busy}
                                className="form-control rounded-3 py-2 px-3"
                                placeholder="Ek detay veya notlar (isteğe bağlı)..."
                                rows={2}
                                maxLength={FIELD_LIMIT}
                                aria-label="Açıklama"
                                aria-invalid={Boolean(createErrors.description)}
                                aria-describedby="create-description-feedback"
                                id="create-description"
                                value={newTodo.description}
                                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                                style={{ border: "1.5px solid #e2e8f0", fontSize: "0.95rem", resize: "vertical" }}
                            />
                                <FieldFeedback id="create-description-feedback" value={newTodo.description} error={createErrors.description} />
                        </div>


                {/* Öncelik ve Kategori Seçimi */}
                        <div className="mb-3 row g-2">
                            <div className="col-md-6">
                                <label htmlFor="create-priority" className="form-label small fw-semibold text-muted">Öncelik</label>
                                <select disabled={busy}
                                    className="form-select rounded-3 py-2 px-3"
                                    id="create-priority"
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
                                <label htmlFor="create-category" className="form-label small fw-semibold text-muted">Kategori</label>
                                <input disabled={busy}
                                    type="text"
                                    className="form-control rounded-3 py-2 px-3"
                                    placeholder="Örn: İş, Kişisel"
                                    maxLength={FIELD_LIMIT}
                                list="todo-category-options"
                                aria-label="Kategori"
                                aria-invalid={Boolean(createErrors.category)}
                                aria-describedby="create-category-feedback"
                                id="create-category"
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

    </>);
}
