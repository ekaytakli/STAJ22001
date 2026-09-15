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

/**
 * Kullanıcının Todo kayıtlarını yönettiği ana sayfa bileşenidir.
 *
 * Bu bileşen:
 * - Kullanıcıya ait Todo kayıtlarını backend'den getirir.
 * - Yeni Todo eklenmesini sağlar.
 * - Mevcut Todo kayıtlarının düzenlenmesini sağlar.
 * - Todo'nun tamamlanma durumunu değiştirir.
 * - Todo kayıtlarını siler.
 * - Kayıtları durumlarına göre filtreler.
 * - Kullanıcının sistemden çıkış yapmasını sağlar.
 */
function TodoPage() {
  /**
   * Kullanıcıyı farklı bir route'a yönlendirmek için kullanılır.
   */
  const navigate = useNavigate();

  /**
   * Redux actionlarını çalıştırmak için kullanılan dispatch fonksiyonudur.
   */
  const dispatch = useAppDispatch();

  /**
   * Auth state içerisindeki giriş yapmış kullanıcı bilgisini alır.
   */
  const user = useAppSelector((state) => state.auth.user);

  /**
   * Todo state içerisindeki kayıtları, aktif filtreyi,
   * yüklenme durumunu ve hata mesajını alır.
   */
  const {
    items: todos,
    filter,
    loading,
    error,
  } = useAppSelector((state) => state.todos);

  /**
   * Yeni Todo formunda girilen başlık ve açıklama bilgilerini tutar.
   */
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
  });

  /**
   * Düzenlenmekte olan Todo'nun ID değerini tutar.
   *
   * null değeri, şu anda herhangi bir Todo'nun
   * düzenlenmediğini ifade eder.
   */
  const [editingId, setEditingId] = useState<number | null>(null);

  /**
   * Düzenleme formunda kullanılan yeni başlık ve açıklama
   * bilgilerini tutar.
   */
  const [editTodo, setEditTodo] = useState({
    title: "",
    description: "",
  });

  /**
   * Sayfa ilk açıldığında ve aktif filtre değiştiğinde çalışır.
   *
   * Seçili filtreye uygun Todo kayıtlarını backend'den getirir.
   */
  useEffect(() => {
    dispatch(fetchTodos(filter));
  }, [dispatch, filter]);

  /**
   * Yeni Todo formu gönderildiğinde çalışır.
   *
   * Boş başlıkla Todo oluşturulmasını engeller.
   * Todo başarıyla eklendikten sonra form alanlarını temizler
   * ve aktif filtreye göre listeyi yeniden getirir.
   */
  const handleCreateTodo = async (
      event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    /*
     * Başlık yalnızca boşluklardan oluşuyorsa işlem yapılmaz.
     */
    if (!newTodo.title.trim()) {
      return;
    }

    /*
     * Yeni Todo bilgileri Redux actionı üzerinden backend'e gönderilir.
     */
    await dispatch(addTodo(newTodo));

    /*
     * Todo eklendikten sonra form alanları temizlenir.
     */
    setNewTodo({
      title: "",
      description: "",
    });

    /*
     * Aktif filtreye uygun güncel liste tekrar yüklenir.
     */
    dispatch(fetchTodos(filter));
  };

  /**
   * Kullanıcı Düzenle butonuna bastığında çalışır.
   *
   * Düzenlenecek Todo'nun ID değerini saklar ve mevcut
   * başlık ile açıklamayı düzenleme alanlarına aktarır.
   *
   * @param todo düzenlenecek Todo kaydı
   */
  const handleEditClick = (todo: Todo) => {
    setEditingId(todo.id);

    setEditTodo({
      title: todo.title,
      description: todo.description ?? "",
    });
  };

  /**
   * Düzenlenen Todo bilgilerini backend'e gönderir.
   *
   * Öncelikle düzenlenen kaydın geçerli olup olmadığı kontrol edilir.
   * Güncelleme tamamlandıktan sonra düzenleme modu kapatılır
   * ve liste yeniden yüklenir.
   */
  const handleUpdateTodo = async () => {
    /*
     * Düzenlenen bir Todo yoksa işlem yapılmaz.
     */
    if (editingId === null) {
      return;
    }

    /*
     * Düzenlenen Todo mevcut Redux listesinden bulunur.
     */
    const todo = todos.find(
        (item) => item.id === editingId
    );

    /*
     * Todo bulunamazsa güncelleme işlemi durdurulur.
     */
    if (!todo) {
      return;
    }

    /*
     * Mevcut Todo bilgileri ile düzenleme alanlarından gelen
     * yeni bilgiler birleştirilerek backend'e gönderilir.
     *
     * Bu sayede completed gibi düzenleme formunda bulunmayan
     * alanlar korunur.
     */
    await dispatch(
        saveTodo({
          id: editingId,
          todo: {
            ...todo,
            ...editTodo,
          },
        })
    );

    /*
     * Güncelleme tamamlandıktan sonra düzenleme modu kapatılır.
     */
    setEditingId(null);

    /*
     * Güncel Todo listesi tekrar backend'den alınır.
     */
    dispatch(fetchTodos(filter));
  };

  /**
   * Kullanıcının seçtiği Todo filtresini Redux state'e kaydeder.
   *
   * Filtre değiştiğinde useEffect tekrar çalışır ve uygun kayıtlar getirilir.
   *
   * @param nextFilter seçilen yeni filtre
   */
  const handleFilterChange = (
      nextFilter: TodoFilter
  ) => {
    dispatch(setFilter(nextFilter));
  };

  /**
   * Kullanıcının sistemden çıkış işlemini gerçekleştirir.
   *
   * Redux auth state temizlenir ve kullanıcı giriş sayfasına yönlendirilir.
   */
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  /**
   * Giriş yapmış kullanıcı bilgisi yoksa sayfa içeriği gösterilmez.
   *
   * Route koruması ayrıca uygulama seviyesinde yapılabilir.
   */
  if (!user) {
    return null;
  }

  return (
      <div className="container mt-5">
        {/*
       * Sayfanın üst bölümünde kullanıcı adı ve çıkış butonu gösterilir.
       */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Merhaba, {user.username}!</h2>

          <button
              className="btn btn-outline-danger"
              onClick={handleLogout}
          >
            Çıkış Yap
          </button>
        </div>

        {/*
       * Yeni Todo oluşturma formu.
       */}
        <div className="card shadow mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">
              Yeni Todo Ekle
            </h5>

            <form onSubmit={handleCreateTodo}>
              <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    name="title"
                    placeholder="Başlık"
                    value={newTodo.title}
                    onChange={(event) =>
                        setNewTodo({
                          ...newTodo,
                          title: event.target.value,
                        })
                    }
                    required
                />
              </div>

              <div className="mb-3">
              <textarea
                  className="form-control"
                  name="description"
                  placeholder="Açıklama"
                  value={newTodo.description}
                  onChange={(event) =>
                      setNewTodo({
                        ...newTodo,
                        description: event.target.value,
                      })
                  }
              />
              </div>

              <button
                  className="btn btn-primary"
                  type="submit"
              >
                Ekle
              </button>
            </form>
          </div>
        </div>

        {/*
       * Todo kayıtlarını durumlarına göre filtreleyen buton grubu.
       *
       * Aktif filtre Bootstrap sınıfları kullanılarak
       * görsel olarak vurgulanır.
       */}
        <div
            className="btn-group mb-4"
            role="group"
            aria-label="Todo filtreleri"
        >
          <button
              className={`btn btn-sm ${
                  filter === "all"
                      ? "btn-primary"
                      : "btn-outline-primary"
              }`}
              onClick={() => handleFilterChange("all")}
          >
            Hepsi
          </button>

          <button
              className={`btn btn-sm ${
                  filter === "pending"
                      ? "btn-primary"
                      : "btn-outline-primary"
              }`}
              onClick={() =>
                  handleFilterChange("pending")
              }
          >
            Bekleyen
          </button>

          <button
              className={`btn btn-sm ${
                  filter === "completed"
                      ? "btn-primary"
                      : "btn-outline-primary"
              }`}
              onClick={() =>
                  handleFilterChange("completed")
              }
          >
            Tamamlanan
          </button>
        </div>

        {/*
       * Backend isteği sırasında hata oluşursa kullanıcıya gösterilir.
       */}
        {error && (
            <div className="alert alert-danger">
              {error}
            </div>
        )}

        {/*
       * Todo kayıtları yüklenirken bilgi mesajı gösterilir.
       */}
        {loading && (
            <p className="text-muted">
              Yükleniyor...
            </p>
        )}

        <div className="row">
          {/*
         * Yükleme tamamlandığında liste boşsa kullanıcıya bilgi verilir.
         */}
          {!loading && todos.length === 0 ? (
              <p className="text-muted">
                Henüz todo yok.
              </p>
          ) : (
              /*
               * Todo kayıtları kartlar halinde ekrana yazdırılır.
               */
              todos.map((todo) => (
                  <div
                      className="col-md-6 mb-3"
                      key={todo.id}
                  >
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        {/*
                   * Bu Todo düzenleme modundaysa input alanları,
                   * değilse normal metin görünümü gösterilir.
                   */}
                        {editingId === todo.id ? (
                            <>
                              <input
                                  type="text"
                                  className="form-control mb-2"
                                  name="title"
                                  value={editTodo.title}
                                  onChange={(event) =>
                                      setEditTodo({
                                        ...editTodo,
                                        title: event.target.value,
                                      })
                                  }
                              />

                              <textarea
                                  className="form-control mb-2"
                                  name="description"
                                  value={editTodo.description}
                                  onChange={(event) =>
                                      setEditTodo({
                                        ...editTodo,
                                        description:
                                        event.target.value,
                                      })
                                  }
                              />
                            </>
                        ) : (
                            <>
                              {/*
                       * Tamamlanan Todo kayıtlarının başlık ve açıklaması
                       * üzeri çizili ve soluk biçimde gösterilir.
                       */}
                              <h5
                                  className={
                                    todo.completed
                                        ? "text-decoration-line-through text-muted"
                                        : ""
                                  }
                              >
                                {todo.title}
                              </h5>

                              <p
                                  className={
                                    todo.completed
                                        ? "text-decoration-line-through text-muted"
                                        : ""
                                  }
                              >
                                {todo.description}
                              </p>
                            </>
                        )}

                        {/*
                   * Todo'nun mevcut tamamlanma durumu badge ile gösterilir.
                   */}
                        <span
                            className={`badge ${
                                todo.completed
                                    ? "bg-success"
                                    : "bg-warning text-dark"
                            }`}
                        >
                    {todo.completed
                        ? "Tamamlandı"
                        : "Bekliyor"}
                  </span>

                        <div className="mt-3 d-flex gap-2 flex-wrap">
                          {/*
                     * Todo'nun completed değeri backend'de tersine çevrilir.
                     */}
                          <button
                              className={`btn btn-sm ${
                                  todo.completed
                                      ? "btn-warning"
                                      : "btn-success"
                              }`}
                              onClick={() =>
                                  dispatch(
                                      switchTodoStatus(todo.id)
                                  )
                              }
                          >
                            {todo.completed
                                ? "Geri Al"
                                : "Tamamla"}
                          </button>

                          {/*
                     * Düzenleme modundaysa Kaydet,
                     * normal görünümdeyse Düzenle butonu gösterilir.
                     */}
                          {editingId === todo.id ? (
                              <button
                                  className="btn btn-primary btn-sm"
                                  onClick={handleUpdateTodo}
                              >
                                Kaydet
                              </button>
                          ) : (
                              <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() =>
                                      handleEditClick(todo)
                                  }
                              >
                                Düzenle
                              </button>
                          )}

                          {/*
                     * Seçilen Todo Redux actionı üzerinden silinir.
                     */}
                          <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                  dispatch(
                                      removeTodo(todo.id)
                                  )
                              }
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              ))
          )}
        </div>
      </div>
  );
}

export default TodoPage;