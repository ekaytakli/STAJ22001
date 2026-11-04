import type { Priority, Todo, TodoFilter } from "../../types";
import type { TodoSort } from "./todoHelpers";
import { categoryKey } from "./todoHelpers";

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
    handleListFiltersChange: (query: string, category: string, priority: Priority | "") => void;
    sortOrder: TodoSort;
    setSortOrder: (sort: TodoSort) => void;
    hasListFilters: boolean;
    loading: boolean;
    error: string | null;
    visibleTodos: Todo[];
    totalElements: number;
};


export default function TodoFilters({ searchPending, searchBusy, busy, filter, handleFilterChange, searchQuery, handleSearchChange, categoryFilter, categoryNames, categories, priorityFilter, handleListFiltersChange, sortOrder, setSortOrder, hasListFilters, loading, error, visibleTodos, totalElements }: Props) {
    return (<>
                {/* Filtre Butonları */}
                <div className="d-flex justify-content-center p-1 rounded-3 mb-4 mx-auto" style={{ background: "#e2e8f0", maxWidth: "360px" }}>
                    {([
                        { key: "all", label: "Tümü" },
                        { key: "pending", label: "Bekleyenler" },
                        { key: "completed", label: "Tamamlananlar" },
                    ] as const).map((tab) => (
                        <button disabled={busy}
                            aria-pressed={filter === tab.key}
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
                            maxLength={255}
                            disabled={searchBusy}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            aria-describedby="todo-search-summary"
                        />
                        {searchQuery && <button type="button" disabled={searchBusy} className="btn btn-outline-secondary" onClick={() => handleSearchChange("")}>Temizle</button>}
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
                        {searchPending ? "Arama i\u00e7in yazman\u0131z\u0131n bitmesi bekleniyor..." : !loading && !error ? visibleTodos.length + " / " + totalElements + " g\u00f6rev g\u00f6steriliyor." : ""}
                    </p>
                </div>


    </>);
}
