import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  createTodo,
  deleteTodo,
  getTodos,
  toggleTodo,
  updateTodo,
} from "../api/todoService";
import type { Todo, TodoFilter } from "../types";

// Görevler sayfasında hafızada tuttuğumuz verilerin şablonu.
interface TodosState {
  items: Todo[];
  filter: TodoFilter;
  loading: boolean;
  error: string | null;
}

// Başlangıçta liste boş, seçili filtre "all" (tümü) olarak gelir.
const initialState: TodosState = {
  items: [],
  filter: "all",
  loading: false,
  error: null,
};

// Seçilen filtreye göre görevleri backend'den çeken eylem.
export const fetchTodos = createAsyncThunk("todos/fetch", async (filter: TodoFilter) => {
  const response = await getTodos(filter);
  return response.data;
});

// Yeni bir görev ekleyen eylem (Sadece başlık ve açıklama gönderilir).
export const addTodo = createAsyncThunk(
    "todos/add",
    async (todo: Pick<Todo, "title" | "description">) => {
      const response = await createTodo(todo);
      return response.data;
    },
);

// Görevin başlık ve açıklama gibi detaylarını güncelleyen eylem.
export const saveTodo = createAsyncThunk(
    "todos/save",
    async ({ id, todo }: { id: number; todo: Pick<Todo, "title" | "description" | "completed"> }) => {
      const response = await updateTodo(id, todo);
      return response.data;
    },
);

// Görevin tamamlandı/bekliyor durumunu tersine çeviren eylem.
export const switchTodoStatus = createAsyncThunk("todos/toggle", async (id: number) => {
  const response = await toggleTodo(id);
  return response.data;
});

// Görevi sunucudan silen eylem. Başarılı olursa silinen görevin ID'sini geri döner.
export const removeTodo = createAsyncThunk("todos/delete", async (id: number) => {
  await deleteTodo(id);
  return id;
});

// Görev yönetimini sağlayan Redux dilimi.
const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    // Kullanıcı "Tümü", "Bekleyenler" veya "Tamamlananlar" sekmelerine bastığında filtreyi günceller.
    setFilter(state, action: PayloadAction<TodoFilter>) {
      state.filter = action.payload;
    },
    // Çıkış yapıldığında görev listesini ve hataları temizler.
    clearTodos(state) {
      state.items = [];
      state.error = null;
    },
  },
  // API'den gelen cevaplara göre ekrandaki görev listesini güncelleyen mantık.
  extraReducers: (builder) => {
    builder
        // Görevler çekiliyor: Yükleniyor durumunu aç.
        .addCase(fetchTodos.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        // Görevler başarıyla geldi: Listeyi güncelle ve yükleniyor durumunu kapat.
        .addCase(fetchTodos.fulfilled, (state, action) => {
          state.loading = false;
          state.items = action.payload;
        })
        // Görevler alınamadı: Kullanıcıya hata mesajı göster.
        .addCase(fetchTodos.rejected, (state) => {
          state.loading = false;
          state.error = "Todo kayıtları alınamadı.";
        })
        // Yeni görev eklendiğinde: Eğer aktif filtreye uyuyorsa görevi listenin en başına (unshift) ekle.
        .addCase(addTodo.fulfilled, (state, action) => {
          if (state.filter === "all" || (state.filter === "pending" && !action.payload.completed)) {
            state.items.unshift(action.payload);
          }
        })
        // Görev düzenlendiğinde: Listedeki eski halini bulup yeni haliyle değiştir.
        .addCase(saveTodo.fulfilled, (state, action) => {
          state.items = state.items.map((todo) => (todo.id === action.payload.id ? action.payload : todo));
        })
        // Durum değiştiğinde (tamamlandı/geri alındı): Listeyi güncelle, aktif filtreye uymuyorsa ekrandan hemen düşür.
        .addCase(switchTodoStatus.fulfilled, (state, action) => {
          state.items = state.items
              .map((todo) => (todo.id === action.payload.id ? action.payload : todo))
              .filter((todo) => {
                if (state.filter === "completed") return todo.completed;
                if (state.filter === "pending") return !todo.completed;
                return true;
              });
        })
        // Görev silindiğinde: Silinen görevi listeden filtreleyip çıkar.
        .addCase(removeTodo.fulfilled, (state, action) => {
          state.items = state.items.filter((todo) => todo.id !== action.payload);
        });
  },
});

export const { clearTodos, setFilter } = todosSlice.actions;
export default todosSlice.reducer;