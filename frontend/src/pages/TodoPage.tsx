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
import type { Todo, TodoFilter } from "../types";

// Kullanıcının görevlerini eklediği, sildiği ve listelediği ana çalışma sayfası.
function TodoPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Oturum açmış olan kullanıcının bilgilerini Redux auth durumundan okuyoruz.
    const user = useAppSelector((state) => state.auth.user);

    // Görev listesini, seçili filtreyi ve yüklenme durumunu Redux todos durumundan alıyoruz.
    const {
        items: todos,
        filter,
        loading,
        error,
    } = useAppSelector((state) => state.todos);

    // Yeni görev eklerken formdaki başlık ve açıklama girdilerini sakladığımız yer.
    const [newTodo, setNewTodo] = useState({
        title: "",
        description: "",
    });

    // O anda hangi görevin düzenlendiğini takip eder (null ise düzenleme modu kapalıdır).
    const [editingId, setEditingId] = useState<number | null>(null);

    // Düzenleme sırasında input kutularına yazılan geçici metinleri tutar.
    const [editTodo, setEditTodo] = useState({
        title: "",
        description: "",
    });

    // Sayfa ilk yüklendiğinde veya seçilen filtre ("all", "pending", "completed") değiştiğinde listeyi günceller.
    useEffect(() => {
        dispatch(fetchTodos(filter));
    }, [dispatch, filter]);

    // Yeni görev ekleme butonuna basıldığında tetiklenir.
    const handleCreateTodo = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Başlık boş veya sadece boşluklardan oluşuyorsa kaydetmeyi engelliyoruz.
        if (!newTodo.title.trim()) return;

        await dispatch(addTodo(newTodo));
        // Başarıyla eklendikten sonra form kutularını temizleyip listeyi tekrar tazeletiyoruz.
        setNewTodo({ title: "", description: "" });
        dispatch(fetchTodos(filter));
    };

    // Bir görevin "Düzenle" butonuna tıklandığında mevcut bilgileri düzenleme kutularına doldurur.
    const handleEditClick = (todo: Todo) => {
        setEditingId(todo.id);
        setEditTodo({
            title: todo.title,
            description: todo.description ?? "",
        });
    };

    // Düzenlenen görevi sunucuya kaydedip düzenleme modunu kapatır.
    const handleUpdateTodo = async () => {
        if (editingId === null) return;
        const todo = todos.find((item) => item.id === editingId);
        if (!todo) return;

        // Görevin tamamlandı durumunu bozmadan yeni başlık ve açıklamasını gönderiyoruz.
        await dispatch(
            saveTodo({
                id: editingId,
                todo: { ...todo, ...editTodo },
            })
        );

        setEditingId(null);
        dispatch(fetchTodos(filter));
    };

    // "Tümü", "Bekleyenler" veya "Tamamlananlar" sekmelerine tıklandığında filtreyi değiştirir.
    const handleFilterChange = (nextFilter: TodoFilter) => {
        dispatch(setFilter(nextFilter));
    };

    // Oturumu kapatır, yerel hafızadaki bileti (token) siler ve kullanıcıyı giriş ekranına postalar.
    const handleLogout = () => {
        dispatch(logout());
        navigate("/");
    };

    // Kullanıcı giriş yapmamışsa sayfayı render etmeyip koruyoruz.
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
                {/* Üst Karşılama ve Güvenli Çıkış Çubuğu */}
                <div
                    className="d-flex justify-content-between align-items-center mb-4 p-3 px-4 rounded-4"
                    style={{
                        background: "#ffffff",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                    }}
                >
                    <div className="d-flex align-items-center gap-2">
                        <h3
                            className="m-0"
                            style={{ fontWeight: 700, color: "#1e293b", fontSize: "1.5rem" }}
                        >
                            Merhaba,{" "}
                            <span
                                style={{
                                    background:
                                        "linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #3b82f6 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    fontWeight: 800,
                                }}
                            >
                {user.username}!
              </span>
                        </h3>
                        <span style={{ fontSize: "1.4rem" }}>👋</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="btn btn-sm px-3 py-2 rounded-3"
                        style={{
                            fontWeight: 600,
                            color: "#ef4444",
                            background: "#fee2e2",
                            border: "none",
                            transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "#fecaca")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "#fee2e2")}
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
                                name="title"
                                placeholder="Görev başlığı nedir?"
                                value={newTodo.title}
                                onChange={(e) =>
                                    setNewTodo({ ...newTodo, title: e.target.value })
                                }
                                required
                                style={{
                                    border: "1.5px solid #e2e8f0",
                                    fontSize: "0.95rem",
                                    boxShadow: "none",
                                }}
                            />
                        </div>

                        <div className="mb-3">
              <textarea
                  className="form-control rounded-3 py-2 px-3"
                  name="description"
                  placeholder="Ek detay veya notlar (isteğe bağlı)..."
                  rows={2}
                  value={newTodo.description}
                  onChange={(e) =>
                      setNewTodo({ ...newTodo, description: e.target.value })
                  }
                  style={{
                      border: "1.5px solid #e2e8f0",
                      fontSize: "0.95rem",
                      boxShadow: "none",
                      resize: "none",
                  }}
              />
                        </div>

                        <button
                            type="submit"
                            className="btn text-white w-100 py-2 rounded-3"
                            style={{
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                fontWeight: 600,
                                border: "none",
                                boxShadow: "0 8px 16px -4px rgba(79, 70, 229, 0.35)",
                            }}
                        >
                            + Görevi Kaydet
                        </button>
                    </form>
                </div>

                {/* Görevleri Tümü, Bekleyen ve Tamamlanan şeklinde filtreleyen buton grubu */}
                <div
                    className="d-flex justify-content-center p-1 rounded-3 mb-4 mx-auto"
                    style={{
                        background: "#e2e8f0",
                        maxWidth: "360px",
                    }}
                >
                    {(
                        [
                            { key: "all", label: "Tümü" },
                            { key: "pending", label: "Bekleyenler" },
                            { key: "completed", label: "Tamamlananlar" },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleFilterChange(tab.key)}
                            className="btn btn-sm flex-fill rounded-3 border-0 py-2"
                            style={{
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                color: filter === tab.key ? "#4f46e5" : "#64748b",
                                background: filter === tab.key ? "#ffffff" : "transparent",
                                boxShadow:
                                    filter === tab.key ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sunucudan bir hata gelirse görünen uyarı paneli */}
                {error && (
                    <div className="alert alert-danger rounded-3 py-2 px-3 small mb-3">
                        {error}
                    </div>
                )}

                {/* Görevler backend'den çekilirken dönen yükleniyor simgesi */}
                {loading && (
                    <div className="text-center py-4" style={{ color: "#64748b" }}>
                        <div
                            className="spinner-border spinner-border-sm text-primary me-2"
                            role="status"
                        ></div>
                        Görevler yükleniyor...
                    </div>
                )}

                {/* Kullanıcının hiç görevi olmadığında gösterilen boş liste durumu */}
                {!loading && todos.length === 0 ? (
                    <div
                        className="text-center py-5 rounded-4"
                        style={{
                            background: "#ffffff",
                            border: "2px dashed #cbd5e1",
                            color: "#94a3b8",
                        }}
                    >
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📝</div>
                        <p className="m-0" style={{ fontWeight: 500 }}>
                            Henüz bir görev eklenmemiş.
                        </p>
                    </div>
                ) : (
                    /* Görevlerin kartlar halinde listelendiği alan */
                    <div className="d-flex flex-column gap-3">
                        {todos.map((todo) => (
                            <div
                                key={todo.id}
                                className="p-3 rounded-4"
                                style={{
                                    background: todo.completed ? "#f8fafc" : "#ffffff",
                                    border: "1px solid",
                                    borderColor: todo.completed ? "#e2e8f0" : "#cbd5e1",
                                    boxShadow: todo.completed
                                        ? "none"
                                        : "0 8px 20px -6px rgba(0, 0, 0, 0.05)",
                                    transition: "all 0.2s ease",
                                    opacity: todo.completed ? 0.75 : 1,
                                }}
                            >
                                {/* Bu görev düzenleniyorsa form inputlarını, değilse normal başlık ve metni göster */}
                                {editingId === todo.id ? (
                                    <>
                                        <input
                                            type="text"
                                            className="form-control rounded-3 mb-2"
                                            value={editTodo.title}
                                            onChange={(e) =>
                                                setEditTodo({ ...editTodo, title: e.target.value })
                                            }
                                        />
                                        <textarea
                                            className="form-control rounded-3 mb-2"
                                            rows={2}
                                            value={editTodo.description}
                                            onChange={(e) =>
                                                setEditTodo({
                                                    ...editTodo,
                                                    description: e.target.value,
                                                })
                                            }
                                        />
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
                                                    textDecoration: todo.completed
                                                        ? "line-through"
                                                        : "none",
                                                }}
                                            >
                                                {todo.title}
                                            </h5>
                                            {todo.description && (
                                                <p
                                                    className="m-0 small"
                                                    style={{
                                                        color: todo.completed ? "#cbd5e1" : "#64748b",
                                                        textDecoration: todo.completed
                                                            ? "line-through"
                                                            : "none",
                                                    }}
                                                >
                                                    {todo.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Görevin bitip bitmediğini gösteren renkli durum etiketi */}
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

                                {/* Görevi tamamlama, düzenleme ve silme işlem butonları */}
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
                                        <button
                                            className="btn btn-primary btn-sm rounded-3 px-3"
                                            onClick={handleUpdateTodo}
                                        >
                                            Kaydet
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-sm rounded-3 px-3"
                                            style={{
                                                background: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                                color: "#475569",
                                            }}
                                            onClick={() => handleEditClick(todo)}
                                        >
                                            Düzenle
                                        </button>
                                    )}

                                    <button
                                        className="btn btn-sm rounded-3 px-3"
                                        style={{
                                            background: "#fef2f2",
                                            border: "none",
                                            color: "#ef4444",
                                        }}
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