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
import TodoIcon from "../components/todo/TodoIcon";
import TodoStats from "../components/TodoStats";
import {
  validateTodo,
  normalizeCategory,
  categoryKey,
  localDateKey,
} from "../components/todo/todoHelpers";
import type {
  TodoForm,
  TodoSort,
  FormErrors,
} from "../components/todo/todoHelpers";
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
    query,
    pageData,
    revision,
  } = useAppSelector((state) => state.todos);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { category: categoryFilter, priority: priorityFilter } = query;
  const [searchQuery, setSearchQuery] = useState(query.search);
  const searchPending = searchQuery.trim() !== query.search;

  useEffect(() => {
    if (!searchPending || activeMutationId !== null) return;
    const timer = window.setTimeout(() => {
      dispatch(setQuery({ search: searchQuery.trim() }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [dispatch, searchQuery, searchPending, activeMutationId]);
  const sortOrder = query.sort as TodoSort;
  const knownCategories = pageData?.categories ?? [];
  const categoryNames = new Map<string, string>();
  for (const category of [
    "Genel",
    ...knownCategories,
    ...todos.map((todo) => todo.category),
    categoryFilter,
  ]) {
    const name = normalizeCategory(category);
    if (name && !categoryNames.has(categoryKey(name)))
      categoryNames.set(categoryKey(name), name);
  }
  const categories = [...categoryNames.values()].sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
  const canonicalCategory = (category: string) =>
    categoryNames.get(categoryKey(category)) ?? normalizeCategory(category);
  const visibleTodos = todos;
  const hasListFilters = Boolean(
    searchQuery.trim() || categoryFilter || priorityFilter,
  );

  const [today, setToday] = useState(() => localDateKey());
  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDateKey()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const busy = loading || activeMutationId !== null || searchPending;

  const [newTodo, setNewTodo] = useState<TodoForm>({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "Genel",
    dueDate: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (editingId !== null) editTitleRef.current?.focus();
  }, [editingId]);

  const focusFirstError = (prefix: string, errors: FormErrors) => {
    const field = Object.keys(errors)[0];
    window.requestAnimationFrame(() =>
      pageRef.current
        ?.querySelector<HTMLElement>(
          "#" + prefix + "-" + (field === "dueDate" ? "due-date" : field),
        )
        ?.focus(),
    );
  };

  const [editTodo, setEditTodo] = useState<TodoForm>({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "Genel",
    dueDate: "",
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
  const hasUnsavedChanges = Boolean(
    originalTodo &&
    (editTodo.title !== originalTodo.title ||
      editTodo.description !== (originalTodo.description ?? "") ||
      editTodo.priority !== originalTodo.priority ||
      editTodo.category !== originalTodo.category ||
      editTodo.dueDate !== (originalTodo.dueDate ?? "")),
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const confirmDiscardChanges = () =>
    !hasUnsavedChanges ||
    window.confirm(
      "Kaydedilmemi\u015f de\u011fi\u015fiklikler var. De\u011fi\u015fikliklerden vazge\u00e7mek istiyor musunuz?",
    );

  const resetEditing = () => {
    setEditingId(null);
    setEditSubmitted(false);
    setEditTodo({
      title: "",
      description: "",
      priority: "MEDIUM",
      category: "Genel",
      dueDate: "",
    });
  };

  const handleListFiltersChange = (
    query: string,
    category: string,
    priority: Priority | "",
  ) => {
    if (activeMutationId !== null) return;
    if (originalTodo) {
      if (!confirmDiscardChanges()) return;
      resetEditing();
    }
    setSearchQuery(query);
    dispatch(setQuery({ search: query.trim(), category, priority }));
  };

  const handleSortChange = (sort: TodoSort) => {
    if (loading || activeMutationId !== null || !confirmDiscardChanges())
      return;
    resetEditing();
    dispatch(setQuery({ sort, search: searchQuery.trim() }));
  };
  const handlePagination = (page: number, size = query.size) => {
    if (busy || !confirmDiscardChanges()) return;
    resetEditing();
    dispatch(setQuery({ page, size }));
  };

  const handleSearchChange = (value: string) => {
    if (activeMutationId !== null) return;
    if (originalTodo) {
      if (!confirmDiscardChanges()) return;
      resetEditing();
    }
    setSearchQuery(value);
    if (!value.trim() && query.search) dispatch(setQuery({ search: "" }));
  };

  const handleCancelEdit = () => {
    if (busy || !confirmDiscardChanges()) return;
    const previousId = editingId;
    resetEditing();
    window.requestAnimationFrame(() =>
      document.getElementById("edit-button-" + previousId)?.focus(),
    );
  };

  const handleToggleTodo = async (id: number) => {
    if (busy || (editingId === id && !confirmDiscardChanges())) return;
    setSuccessMessage(null);
    const result = await dispatch(switchTodoStatus(id));
    if (switchTodoStatus.fulfilled.match(result)) {
      setSuccessMessage(
        result.payload.completed
          ? "G\u00f6rev tamamland\u0131."
          : "G\u00f6rev bekleyenlere ta\u015f\u0131nd\u0131.",
      );
    }
    if (switchTodoStatus.fulfilled.match(result) && editingId === id)
      resetEditing();
  };

  const handleDeleteTodo = async (id: number) => {
    if (busy) return;
    const todo = todos.find((item) => item.id === id);
    if (!todo) return;

    const unsavedWarning =
      editingId === id && hasUnsavedChanges
        ? "\nKaydedilmemi\u015f de\u011fi\u015fiklikleriniz de silinecek."
        : "";
    const confirmed = window.confirm(
      "\u201c" +
        todo.title +
        "\u201d g\u00f6revini kal\u0131c\u0131 olarak silmek istiyor musunuz?" +
        "\nBu i\u015flem geri al\u0131namaz." +
        unsavedWarning,
    );
    if (!confirmed) return;

    setSuccessMessage(null);
    const result = await dispatch(removeTodo(id));
    if (removeTodo.fulfilled.match(result))
      setSuccessMessage("G\u00f6rev silindi.");
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
    const result = await dispatch(
      addTodo({
        ...newTodo,
        title: newTodo.title.trim(),
        category: canonicalCategory(newTodo.category),
        dueDate: newTodo.dueDate || null,
      }),
    );
    if (!addTodo.fulfilled.match(result)) return;
    setSuccessMessage("G\u00f6rev eklendi.");
    setCreateSubmitted(false);
    setNewTodo({
      title: "",
      description: "",
      priority: "MEDIUM",
      category: "Genel",
      dueDate: "",
    });
  };

  const handleEditClick = (todo: Todo) => {
    if (busy || editingId === todo.id || !confirmDiscardChanges()) return;
    setEditSubmitted(false);
    setEditingId(todo.id);
    setEditTodo({
      title: todo.title,
      description: todo.description ?? "",
      priority: todo.priority ?? "MEDIUM",
      category: todo.category?.trim() ? todo.category : "Genel",
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
        todo: {
          ...todo,
          ...editTodo,
          title: editTodo.title.trim(),
          category: canonicalCategory(editTodo.category),
          dueDate: editTodo.dueDate || null,
        },
      }),
    );

    if (!saveTodo.fulfilled.match(result)) return;
    setSuccessMessage("G\u00f6rev g\u00fcncellendi.");
    resetEditing();
  };

  const handleFilterChange = (nextFilter: TodoFilter) => {
    if (
      loading ||
      activeMutationId !== null ||
      nextFilter === filter ||
      !confirmDiscardChanges()
    )
      return;
    resetEditing();
    setSuccessMessage(null);
    dispatch(setQuery({ search: searchQuery.trim() }));
    dispatch(setFilter(nextFilter));
  };

  const handleLogout = () => {
    if (!confirmDiscardChanges()) return;
    dispatch(logout());
    navigate("/");
  };

  if (!user) return null;

  const total = pageData?.total ?? 0;
  const completed = pageData?.completed ?? 0;
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const sectionTitle =
    filter === "pending"
      ? "Bekleyen görevler"
      : filter === "completed"
        ? "Tamamlanan görevler"
        : "Tüm görevler";
  const focusComposer = () => {
    const title = document.getElementById("create-title");
    title?.scrollIntoView({ behavior: "smooth", block: "center" });
    title?.focus({ preventScroll: true });
  };

  return (
    <div ref={pageRef} className="todo-page">
      <a className="todo-skip" href="#task-list">
        Görevlere geç
      </a>
      <datalist id="todo-category-options">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
      <aside className="todo-sidebar" aria-label="Çalışma alanı">
        <a
          className="todo-brand"
          href="#task-list"
          aria-label="Odak, görevlerine git"
        >
          <span className="brand-mark">
            <TodoIcon name="check" size={22} />
          </span>
          odak<span className="brand-dot">.</span>
        </a>
        <div className="workspace-name">
          <span className="workspace-avatar">
            {user.username.slice(0, 1).toLocaleUpperCase("tr-TR")}
          </span>
          <div>
            <strong>Kişisel alanım</strong>
            <span>Her şey yerli yerinde.</span>
          </div>
        </div>
        <p className="sidebar-label">ÇALIŞMA ALANI</p>
        <nav className="sidebar-navigation" aria-label="Görev durumları">
          {(
            [
              { key: "all", label: "Görevlerim", icon: "grid", count: total },
              {
                key: "pending",
                label: "Bekleyen görevler",
                icon: "clock",
                count: total - completed,
              },
              {
                key: "completed",
                label: "Biten görevler",
                icon: "check",
                count: completed,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              className={
                "sidebar-link" + (filter === item.key ? " is-active" : "")
              }
              disabled={loading || activeMutationId !== null}
              aria-current={filter === item.key ? "page" : undefined}
              onClick={() => handleFilterChange(item.key)}
            >
              <TodoIcon name={item.icon} size={18} />
              <span>{item.label}</span>
              <small>{pageData ? item.count : "—"}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-section-heading">
          <p className="sidebar-label">KATEGORİLER</p>
          <TodoIcon name="folder" size={15} />
        </div>
        <nav className="sidebar-categories" aria-label="Kategoriler">
          <button
            className={"category-link" + (!categoryFilter ? " is-active" : "")}
            disabled={busy}
            onClick={() =>
              handleListFiltersChange(searchQuery, "", priorityFilter)
            }
          >
            <span className="category-dot" />
            Tüm kategoriler
          </button>
          {categories.map((category, index) => (
            <button
              key={category}
              className={
                "category-link" +
                (categoryKey(categoryFilter) === categoryKey(category)
                  ? " is-active"
                  : "")
              }
              disabled={busy}
              onClick={() =>
                handleListFiltersChange(searchQuery, category, priorityFilter)
              }
            >
              <span className={"category-dot dot-" + (index % 4)} />
              <span>{category}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-encouragement">
            <TodoIcon name="leaf" size={25} />
            <h2>Adım adım, ileri.</h2>
            <p>
              {total
                ? completed +
                  " görevi geride bıraktın. Kendi ritminde devam et."
                : "İlk küçük adımın için buradayız."}
            </p>
            <div className="sidebar-progress">
              <span style={{ width: progress + "%" }} />
            </div>
          </div>
          <button
            className="sidebar-account"
            onClick={handleLogout}
            aria-label="Çıkış Yap"
          >
            <span className="account-avatar">
              {user.username.slice(0, 2).toLocaleUpperCase("tr-TR")}
            </span>
            <span>
              <strong>{user.username}</strong>
              <small>Çıkış yap</small>
            </span>
            <TodoIcon name="logout" size={18} />
          </button>
        </div>
      </aside>
      <main className="todo-main">
        <header className="todo-topbar">
          <div className="breadcrumb-label">
            Kişisel alanım <span>/</span> <strong>Görevler</strong>
          </div>
          <div className="topbar-date">
            <TodoIcon name="calendar" size={16} />
            <time dateTime={today}>
              {new Date(today + "T12:00:00").toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
        </header>
        <div className="todo-content">
          <div className="todo-page-heading">
            <div>
              <span className="eyebrow">HER YENİ GÜN, YENİ BİR ADIM</span>
              <h1>
                Merhaba, {user.username}
                <span className="greeting-dot">.</span>
              </h1>
              <p>
                Zihnini boşalt. Önceliklerini belirle. Kendi ritminde ilerle.
              </p>
            </div>
            <button
              className="todo-primary heading-add"
              onClick={focusComposer}
              disabled={busy}
            >
              <TodoIcon name="plus" size={18} />
              Yeni görev
            </button>
          </div>
          <TodoStats
            total={total}
            completed={completed}
            busy={busy}
            listError={errorSource === "fetch" && Boolean(error)}
          />
          <div className="todo-workspace">
            <section
              className="todo-list-panel"
              id="task-list"
              aria-labelledby="task-list-title"
              tabIndex={-1}
            >
              <div className="list-panel-heading">
                <div>
                  <span className="eyebrow">SANA AİT BİR PLAN</span>
                  <h2 id="task-list-title" aria-label={sectionTitle}>
                    {sectionTitle}
                    <span>{pageData?.totalElements ?? "—"}</span>
                  </h2>
                </div>
                <span className="list-view-label">
                  <TodoIcon name="grid" size={15} />
                  Liste görünümü
                </span>
              </div>
              <TodoFilters
                searchPending={searchPending}
                searchBusy={activeMutationId !== null}
                busy={loading || activeMutationId !== null}
                filter={filter}
                handleFilterChange={handleFilterChange}
                searchQuery={searchQuery}
                handleSearchChange={handleSearchChange}
                categoryFilter={categoryFilter}
                categoryNames={categoryNames}
                categories={categories}
                priorityFilter={priorityFilter}
                handleListFiltersChange={handleListFiltersChange}
                sortOrder={sortOrder}
                setSortOrder={handleSortChange}
                hasListFilters={hasListFilters}
                loading={loading}
                error={error}
                visibleTodos={visibleTodos}
                totalElements={pageData?.totalElements ?? 0}
              />
              {successMessage && !error && !busy && (
                <div role="status" className="todo-notice notice-success">
                  <TodoIcon name="check" size={18} />
                  <span>{successMessage}</span>
                  <button
                    aria-label="Bildirimi kapat"
                    onClick={() => setSuccessMessage(null)}
                  >
                    <TodoIcon name="close" size={16} />
                  </button>
                </div>
              )}
              {activeMutationId && (
                <p role="status" className="todo-operation">
                  Değişikliklerin kaydediliyor…
                </p>
              )}
              {error && (
                <div role="alert" className="todo-notice notice-error">
                  <span>{error}</span>
                  {errorSource === "fetch" ? (
                    <button
                      disabled={busy}
                      onClick={() => dispatch(fetchTodos())}
                    >
                      Yeniden dene
                    </button>
                  ) : (
                    <span>İlgili butondan yeniden deneyebilirsin.</span>
                  )}
                </div>
              )}
              {loading && (
                <div className="todo-loading" role="status">
                  <span className="loading-dot" />
                  Görevlerin yükleniyor…
                </div>
              )}
              {!loading && !error && visibleTodos.length === 0 ? (
                <div className="todo-empty">
                  <span className="empty-symbol">
                    <TodoIcon
                      name={hasListFilters ? "search" : "check"}
                      size={30}
                    />
                  </span>
                  <h3>
                    {hasListFilters
                      ? "Burada bir eşleşme yok."
                      : filter === "completed"
                        ? "İlk tamamlanan görevini bekliyoruz."
                        : filter === "pending"
                          ? "Hepsi tamam, derin bir nefes."
                          : "Bir küçük adımla başla."}
                  </h3>
                  <p>
                    {hasListFilters
                      ? "Aramanı veya filtrelerini değiştirerek tekrar dene."
                      : "Yeni bir görev ekleyerek planına yer aç."}
                  </p>
                  {hasListFilters ? (
                    <button
                      className="todo-secondary"
                      onClick={() => handleListFiltersChange("", "", "")}
                    >
                      Filtreleri temizle
                    </button>
                  ) : (
                    <button className="todo-secondary" onClick={focusComposer}>
                      <TodoIcon name="plus" size={16} />
                      Görev ekle
                    </button>
                  )}
                </div>
              ) : (
                <div className="todo-task-list" aria-busy={loading}>
                  {visibleTodos.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      busy={busy}
                      editingId={editingId}
                      editTodo={editTodo}
                      setEditTodo={setEditTodo}
                      editErrors={editErrors}
                      editTitleRef={editTitleRef}
                      today={today}
                      handleToggleTodo={handleToggleTodo}
                      handleCancelEdit={handleCancelEdit}
                      handleUpdateTodo={handleUpdateTodo}
                      handleEditClick={handleEditClick}
                      handleDeleteTodo={handleDeleteTodo}
                    />
                  ))}
                </div>
              )}
              <nav aria-label="Görev sayfaları" className="todo-pagination">
                <div>
                  <label htmlFor="page-size">Sayfada</label>
                  <select
                    id="page-size"
                    className="form-select"
                    value={query.size}
                    disabled={busy}
                    onChange={(event) =>
                      handlePagination(0, Number(event.target.value))
                    }
                  >
                    {[10, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>görev</span>
                </div>
                <span className="page-indicator">
                  {(pageData?.page ?? 0) + 1} /{" "}
                  {Math.max(1, pageData?.totalPages ?? 0)}
                </span>
                <div>
                  <button
                    disabled={busy || !pageData || pageData.page === 0}
                    onClick={() => handlePagination((pageData?.page ?? 0) - 1)}
                  >
                    Önceki
                  </button>
                  <button
                    disabled={
                      busy ||
                      !pageData ||
                      pageData.page + 1 >= pageData.totalPages
                    }
                    onClick={() => handlePagination((pageData?.page ?? 0) + 1)}
                  >
                    Sonraki
                  </button>
                </div>
              </nav>
            </section>
            <aside className="todo-composer-rail">
              <TodoCreateForm
                busy={busy}
                newTodo={newTodo}
                setNewTodo={setNewTodo}
                createErrors={createErrors}
                handleCreateTodo={handleCreateTodo}
              />
              <div className="planning-note">
                <span className="planning-note-icon">
                  <TodoIcon name="calendar" size={21} />
                </span>
                <h2>Önce önemli olan.</h2>
                <p>
                  Teslim tarihlerini ekle, önceliklerini seç. Geri kalanına
                  birer adımda ulaşırsın.
                </p>
                <button
                  onClick={() => handleSortChange("due-asc")}
                  disabled={busy}
                >
                  Yaklaşanları sırala <TodoIcon name="arrow" size={15} />
                </button>
              </div>
            </aside>
          </div>
          <footer className="todo-footer">
            <span>odak.</span>Biraz düzen, biraz ferahlık.
          </footer>
        </div>
      </main>
    </div>
  );
}
export default TodoPage;
