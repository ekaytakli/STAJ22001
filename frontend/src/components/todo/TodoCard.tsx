import type { Todo } from "../../types";
import type { Dispatch, SetStateAction, RefObject } from "react";
import type { TodoForm, FormErrors } from "./todoHelpers";
import { normalizeCategory } from "./todoHelpers";
import TodoFields from "./TodoFields";
import TodoIcon from "./TodoIcon";
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
export default function TodoCard({
  todo,
  busy,
  editingId,
  editTodo,
  setEditTodo,
  editErrors,
  editTitleRef,
  today,
  handleToggleTodo,
  handleCancelEdit,
  handleUpdateTodo,
  handleEditClick,
  handleDeleteTodo,
}: Props) {
  const editing = editingId === todo.id;
  const overdue =
    !todo.completed && Boolean(todo.dueDate && todo.dueDate < today);
  const priorityValue = todo.priority ?? "MEDIUM";
  const priority = { HIGH: "Yüksek", MEDIUM: "Orta", LOW: "Düşük" }[
    priorityValue
  ];
  return (
    <article
      className={
        "todo-card" +
        (todo.completed ? " is-complete" : "") +
        (overdue ? " is-overdue" : "") +
        (editing ? " is-editing" : "")
      }
      aria-label={todo.title}
    >
      {editing ? (
        <div className="task-edit" onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (!busy) handleUpdateTodo();
          }
        }}>
          <div className="edit-heading">
            <TodoIcon name="edit" size={18} />
            <h3>Görevi düzenle</h3>
          </div>
          <TodoFields
            prefix="edit"
            values={editTodo}
            onChange={setEditTodo}
            errors={editErrors}
            busy={busy}
            titleRef={editTitleRef}
          />
        </div>
      ) : (
        <div className="task-row">
          <button
            className={"task-check" + (todo.completed ? " is-checked" : "")}
            aria-label={
              todo.completed ? "Görevi bekleyenlere al" : "Görevi tamamla"
            }
            aria-pressed={todo.completed}
            disabled={busy}
            onClick={() => handleToggleTodo(todo.id)}
          >
            <span>{todo.completed && <TodoIcon name="check" size={15} />}</span>
          </button>
          <div className="task-body">
            <div className="task-title-line">
              <h3>{todo.title}</h3>
              {todo.completed && (
                <span className="task-done-label">Tamamlandı</span>
              )}
            </div>
            {todo.description && (
              <p className="task-description">{todo.description}</p>
            )}
            <div className="task-meta">
              <span className="task-category">
                <TodoIcon name="folder" size={13} />
                {normalizeCategory(todo.category || "Genel")}
              </span>
              <span
                className={
                  "task-priority priority-" + priorityValue.toLowerCase()
                }
              >
                <i />
                {priority}
              </span>
              {todo.dueDate && (
                <span className={"task-date" + (overdue ? " is-overdue" : "")}>
                  <TodoIcon name="calendar" size={13} />
                  {todo.dueDate === today
                    ? "Bugün"
                    : new Date(todo.dueDate + "T00:00:00").toLocaleDateString(
                        "tr-TR",
                        { day: "numeric", month: "short" },
                      )}
                  {overdue && " · Gecikti"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="todo-actions">
        <button
          className="task-action task-toggle-text"
          disabled={busy}
          onClick={() => handleToggleTodo(todo.id)}
        >
          <TodoIcon name={todo.completed ? "clock" : "check"} size={15} />
          {todo.completed ? "Geri al" : "Tamamla"}
        </button>
        <div className="task-actions-right">
          {editing ? (
            <>
              <button
                className="task-action"
                disabled={busy}
                onClick={handleCancelEdit}
              >
                İptal
              </button>
              <button
                className="todo-primary task-save"
                disabled={busy}
                onClick={handleUpdateTodo}
              >
                Kaydet
              </button>
            </>
          ) : (
            <button
              id={"edit-button-" + todo.id}
              className="task-action"
              disabled={busy}
              onClick={() => handleEditClick(todo)}
            >
              <TodoIcon name="edit" size={14} />
              Düzenle
            </button>
          )}
          <button
            className="task-action task-delete"
            disabled={busy}
            onClick={() => handleDeleteTodo(todo.id)}
          >
            <TodoIcon name="trash" size={14} />
            Sil
          </button>
        </div>
      </div>
      {!editing && (todo.createdAt || todo.updatedAt) && (
        <details className="task-history">
          <summary>Tarih bilgileri</summary>
          {todo.createdAt && (
            <p>
              Oluşturulma: {new Date(todo.createdAt).toLocaleString("tr-TR")}
            </p>
          )}
          {todo.updatedAt && (
            <p>
              Güncellenme: {new Date(todo.updatedAt).toLocaleString("tr-TR")}
            </p>
          )}
        </details>
      )}
    </article>
  );
}
