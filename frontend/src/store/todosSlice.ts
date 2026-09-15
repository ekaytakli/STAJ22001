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

interface TodosState {
  items: Todo[];
  filter: TodoFilter;
  loading: boolean;
  error: string | null;
}

const initialState: TodosState = {
  items: [],
  filter: "all",
  loading: false,
  error: null,
};

export const fetchTodos = createAsyncThunk("todos/fetch", async (filter: TodoFilter) => {
  const response = await getTodos(filter);
  return response.data;
});

export const addTodo = createAsyncThunk(
  "todos/add",
  async (todo: Pick<Todo, "title" | "description">) => {
    const response = await createTodo(todo);
    return response.data;
  },
);

export const saveTodo = createAsyncThunk(
  "todos/save",
  async ({ id, todo }: { id: number; todo: Pick<Todo, "title" | "description" | "completed"> }) => {
    const response = await updateTodo(id, todo);
    return response.data;
  },
);

export const switchTodoStatus = createAsyncThunk("todos/toggle", async (id: number) => {
  const response = await toggleTodo(id);
  return response.data;
});

export const removeTodo = createAsyncThunk("todos/delete", async (id: number) => {
  await deleteTodo(id);
  return id;
});

const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<TodoFilter>) {
      state.filter = action.payload;
    },
    clearTodos(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state) => {
        state.loading = false;
        state.error = "Todo kayıtları alınamadı.";
      })
      .addCase(addTodo.fulfilled, (state, action) => {
        if (state.filter === "all" || (state.filter === "pending" && !action.payload.completed)) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(saveTodo.fulfilled, (state, action) => {
        state.items = state.items.map((todo) => (todo.id === action.payload.id ? action.payload : todo));
      })
      .addCase(switchTodoStatus.fulfilled, (state, action) => {
        state.items = state.items
          .map((todo) => (todo.id === action.payload.id ? action.payload : todo))
          .filter((todo) => {
            if (state.filter === "completed") return todo.completed;
            if (state.filter === "pending") return !todo.completed;
            return true;
          });
      })
      .addCase(removeTodo.fulfilled, (state, action) => {
        state.items = state.items.filter((todo) => todo.id !== action.payload);
      });
  },
});

export const { clearTodos, setFilter } = todosSlice.actions;
export default todosSlice.reducer;
