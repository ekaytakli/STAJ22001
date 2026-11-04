/**
 * GÖREV LİSTESİ VE CRUD DURUM YÖNETİMİ (TODOS SLICE)
 *
 * Bu modül, ekrandaki görevlerin listesini, aktif filtre durumunu (tümü, bekleyen, tamamlanan)
 * ve backend ile yapılan tüm görev işlemlerini (ekleme, silme, güncelleme, durum değiştirme) yönetir.
 * Sayfa yenilenmesine gerek kalmadan ekrandaki görev listesini anında ve dinamik olarak günceller.
 */

import { createAsyncThunk, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { logout } from "./authSlice";
import type { RootState } from "./store";
import { getApiErrorMessage } from "../api/errors";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
    createTodo,
    deleteTodo,
    getTodoPage,
    toggleTodo,
    updateTodo,
} from "../api/todoService";
import type { Todo, TodoFilter, CreateTodoRequest, UpdateTodoRequest } from "../types";

// Görevler sayfasında hafızada tuttuğumuz verilerin şablonu.
interface TodosState {
    query: import("../types").TodoPageQuery;
    pageData: import("../types").TodoPageResponse | null;
    revision: number;
    items: Todo[];
    filter: TodoFilter;
    loading: boolean;
    activeFetchId: string | null;
    activeMutationId: string | null;
    error: string | null;
    errorSource: "fetch" | "mutation" | null;
}

// Başlangıçta liste boş, seçili filtre "all" (tümü) olarak gelir.
const initialState: TodosState = {
    query: { page: 0, size: 10, search: "", category: "", priority: "", sort: "default" },
    pageData: null,
    revision: 0,
    items: [],
    filter: "all",
    loading: false,
    activeFetchId: null,
    activeMutationId: null,
    error: null,
    errorSource: null,
};

// Seçilen filtreye göre görevleri backend'den çeken eylem.
export const fetchTodos = createAsyncThunk("todos/fetch", async (_: void, { signal, getState }) => {
    const state = (getState() as RootState).todos;
    const response = await getTodoPage({ ...state.query, status: state.filter }, signal);
    return response.data;
});

const mutationOptions = {
    condition: (_: unknown, { getState }: { getState: () => unknown }) => {
        const state = getState() as RootState;
        return Boolean(state.auth.token) && state.todos.activeMutationId === null && !state.todos.loading;
    },
};
// Yeni görevin düzenlenebilir alanlarını gönderir.
export const addTodo = createAsyncThunk(
    "todos/add",
    async (todo: CreateTodoRequest, { rejectWithValue }) => {
        try {
            const response = await createTodo(todo);
            return response.data;
        } catch (error) {
            return rejectWithValue(getApiErrorMessage(error, "Görev işlemi tamamlanamadı."));
        }
    },
    mutationOptions,
);

// Görevin başlık ve açıklama gibi detaylarını güncelleyen eylem.
export const saveTodo = createAsyncThunk(
    "todos/save",
    async ({ id, todo }: { id: number; todo: UpdateTodoRequest }, { rejectWithValue }) => {
        try {
            const response = await updateTodo(id, todo);
            return response.data;
        } catch (error) {
            return rejectWithValue(getApiErrorMessage(error, "Görev işlemi tamamlanamadı."));
        }
    },
    mutationOptions,
);

// Görevin tamamlandı/bekliyor durumunu tersine çeviren eylem.
export const switchTodoStatus = createAsyncThunk("todos/toggle", async (id: number, { rejectWithValue }) => {
        try {
            const response = await toggleTodo(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(getApiErrorMessage(error, "Görev işlemi tamamlanamadı."));
        }
}, mutationOptions);

// Görevi sunucudan silen eylem. Başarılı olursa silinen görevin ID'sini geri döner.
export const removeTodo = createAsyncThunk("todos/delete", async (id: number, { rejectWithValue }) => {
    try {
        await deleteTodo(id);
        return id;
    } catch (error) {
        return rejectWithValue(getApiErrorMessage(error, "Görev silinemedi."));
    }
}, mutationOptions);

// Görev yönetimini sağlayan Redux dilimi.
const todosSlice = createSlice({
    name: "todos",
    initialState,
    reducers: {
        // Kullanıcı "Tümü", "Bekleyenler" veya "Tamamlananlar" sekmelerine bastığında filtreyi günceller.
        setQuery(state, action: PayloadAction<Partial<import("../types").TodoPageQuery>>) {
            if (state.activeMutationId) return;
            state.query = { ...state.query, page: 0, ...action.payload };
            state.activeFetchId = null;
        },
        setFilter(state, action: PayloadAction<TodoFilter>) {
            if (state.activeMutationId || state.filter === action.payload) return;
            state.query.page = 0;
            state.filter = action.payload;
            state.activeFetchId = null;
            state.items = [];
        },
        // Çıkış yapıldığında görev listesini ve hataları temizler.
        clearTodos() {
            return { ...initialState };
        },
    },
    // API'den gelen cevaplara göre ekrandaki görev listesini güncelleyen mantık.
    extraReducers: (builder) => {
        builder
            .addCase(logout, () => ({ ...initialState }))
            // Görevler çekiliyor: Yükleniyor durumunu aç.
            .addCase(fetchTodos.pending, (state, action) => {
                state.activeFetchId = action.meta.requestId;
                state.loading = true;
                state.error = null;
                state.errorSource = null;
            })
            // Görevler başarıyla geldi: Listeyi güncelle ve yükleniyor durumunu kapat.
            .addCase(fetchTodos.fulfilled, (state, action) => {
                if (state.activeFetchId !== action.meta.requestId) return;
                state.loading = false;
                state.activeFetchId = null;
                state.items = action.payload.items;
                state.pageData = action.payload;
            })
            // Görevler alınamadı: Kullanıcıya hata mesajı göster.
            .addCase(fetchTodos.rejected, (state, action) => {
                if (state.activeFetchId !== action.meta.requestId) return;
                state.activeFetchId = null;
                if (action.meta.aborted) { state.loading = false; return; }
                state.loading = false;
                state.errorSource = "fetch";
                state.error = "Todo kayıtları alınamadı.";
            })
            // Yeni görev eklendiğinde: Eğer aktif filtreye uyuyorsa görevi listenin en başına (unshift) ekle.
            .addMatcher(isAnyOf(addTodo.fulfilled, saveTodo.fulfilled, switchTodoStatus.fulfilled, removeTodo.fulfilled), (state, action) => {
                if (state.activeMutationId !== action.meta.requestId) return;
                state.activeMutationId = null;
                state.revision += 1;
            })
            .addMatcher(isAnyOf(addTodo.pending, saveTodo.pending, switchTodoStatus.pending, removeTodo.pending), (state, action) => {
                state.activeMutationId = action.meta.requestId;
                state.activeFetchId = null;
                state.loading = false;
                state.error = null;
                state.errorSource = null;
            })
            .addMatcher(isAnyOf(addTodo.rejected, saveTodo.rejected, switchTodoStatus.rejected, removeTodo.rejected), (state, action) => {
                if (state.activeMutationId !== action.meta.requestId) return;
                state.activeMutationId = null;
                state.errorSource = "mutation";
                state.error = String(action.payload ?? "Görev işlemi tamamlanamadı.");
            });
    },
});

export const { clearTodos, setFilter, setQuery } = todosSlice.actions;
export default todosSlice.reducer;
