import type { Priority, Todo, TodoFilter } from "../../types";
import type { TodoSort } from "./todoHelpers";
import { categoryKey } from "./todoHelpers";
import TodoIcon from "./TodoIcon";
type Props = {
  busy: boolean;
  searchBusy: boolean;
  searchPending: boolean;
  filter: TodoFilter;
  handleFilterChange: (filter: TodoFilter) => void;
  searchQuery: string;
  handleSearchChange: (query: string) => void;
  categoryFilter: string;
  categoryNames: Map<string, string>;
  categories: string[];
  priorityFilter: Priority | "";
  handleListFiltersChange: (
    query: string,
    category: string,
    priority: Priority | "",
  ) => void;
  sortOrder: TodoSort;
  setSortOrder: (sort: TodoSort) => void;
  hasListFilters: boolean;
  loading: boolean;
  error: string | null;
  visibleTodos: Todo[];
  totalElements: number;
};
export default function TodoFilters({
  searchPending,
  searchBusy,
  busy,
  filter,
  handleFilterChange,
  searchQuery,
  handleSearchChange,
  categoryFilter,
  categoryNames,
  categories,
  priorityFilter,
  handleListFiltersChange,
  sortOrder,
  setSortOrder,
  hasListFilters,
  loading,
  error,
  visibleTodos,
  totalElements,
}: Props) {
  return (
    <div className="todo-filters">
      <div className="filter-status-tabs" aria-label="Görev durumu">
        {(
          [
            { key: "all", label: "Tümü" },
            { key: "pending", label: "Bekleyenler" },
            { key: "completed", label: "Tamamlananlar" },
          ] as const
        ).map((tab) => (
          <button
            disabled={busy}
            key={tab.key}
            aria-pressed={filter === tab.key}
            className={filter === tab.key ? "is-active" : ""}
            onClick={() => handleFilterChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="todo-search-box">
        <TodoIcon name="search" size={17} />
        <label htmlFor="todo-search" className="visually-hidden">
          Görev ara
        </label>
        <input
          id="todo-search"
          type="search"
          placeholder="Görevlerinde ara…"
          value={searchQuery}
          maxLength={255}
          disabled={searchBusy}
          onChange={(event) => handleSearchChange(event.target.value)}
          aria-describedby="todo-search-summary"
        />
        {searchQuery && (
          <button
            className="search-clear"
            disabled={searchBusy}
            onClick={() => handleSearchChange("")}
            aria-label="Temizle"
          >
            <TodoIcon name="close" size={15} />
          </button>
        )}
      </div>
      <div className="filter-selects">
        <div>
          <label htmlFor="category-filter">Kategori</label>
          <select
            id="category-filter"
            className="form-select"
            disabled={busy}
            value={categoryNames.get(categoryKey(categoryFilter)) ?? ""}
            onChange={(event) =>
              handleListFiltersChange(
                searchQuery,
                event.target.value,
                priorityFilter,
              )
            }
          >
            <option value="">Tüm kategoriler</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority-filter">Öncelik</label>
          <select
            id="priority-filter"
            className="form-select"
            disabled={busy}
            value={priorityFilter}
            onChange={(event) =>
              handleListFiltersChange(
                searchQuery,
                categoryFilter,
                event.target.value as Priority | "",
              )
            }
          >
            <option value="">Tüm öncelikler</option>
            <option value="HIGH">Yüksek</option>
            <option value="MEDIUM">Orta</option>
            <option value="LOW">Düşük</option>
          </select>
        </div>
        <div>
          <label htmlFor="todo-sort">Sıralama</label>
          <select
            id="todo-sort"
            className="form-select"
            disabled={busy}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as TodoSort)}
          >
            <option value="default">Varsayılan sıra</option>
            <option value="created-desc">En yeni oluşturulan</option>
            <option value="updated-desc">Son güncellenen</option>
            <option value="due-asc">Teslim tarihi: en yakın</option>
            <option value="title-asc">Başlık: A → Z</option>
            <option value="title-desc">Başlık: Z → A</option>
            <option value="priority-desc">Öncelik: Yüksek → Düşük</option>
            <option value="priority-asc">Öncelik: Düşük → Yüksek</option>
          </select>
        </div>
      </div>
      <div className="filter-summary">
        <p id="todo-search-summary" role="status">
          {searchPending
            ? "Araman hazırlanıyor…"
            : !loading && !error
              ? totalElements +
                " görevden " +
                visibleTodos.length +
                " tanesi gösteriliyor"
              : "Görevlerin hazırlanıyor…"}
        </p>
        {hasListFilters && (
          <button
            disabled={busy}
            onClick={() => handleListFiltersChange("", "", "")}
          >
            Filtreleri sıfırla
          </button>
        )}
      </div>
    </div>
  );
}
