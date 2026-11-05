import type { Dispatch, SetStateAction, FormEvent } from "react";
import type { TodoForm, FormErrors } from "./todoHelpers";
import TodoFields from "./TodoFields";
import TodoIcon from "./TodoIcon";
type Props = {
  busy: boolean;
  newTodo: TodoForm;
  setNewTodo: Dispatch<SetStateAction<TodoForm>>;
  createErrors: FormErrors;
  handleCreateTodo: (event: FormEvent<HTMLFormElement>) => void;
  draftNotice?: string | null;
  onClearDraft?: () => void;
};
export default function TodoCreateForm({
  busy,
  newTodo,
  setNewTodo,
  createErrors,
  handleCreateTodo,
  draftNotice,
  onClearDraft,
}: Props) {
  return (
    <section className="todo-composer" aria-labelledby="create-heading">
      <div className="composer-heading">
        <span className="composer-symbol">
          <TodoIcon name="plus" />
        </span>
        <div>
          <h2 id="create-heading">Yeni görev</h2>
        </div>
      </div>
      {draftNotice && <div className="draft-notice"><span>{draftNotice}</span><button type="button" disabled={busy} onClick={onClearDraft} aria-label="Görev taslağını temizle">Temizle</button></div>}
      <form onSubmit={handleCreateTodo} noValidate onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          if (!busy) event.currentTarget.requestSubmit();
        }
      }}>
        <TodoFields
          prefix="create"
          values={newTodo}
          onChange={setNewTodo}
          errors={createErrors}
          busy={busy}
        />
        <button
          type="submit"
          className="todo-primary composer-submit"
          disabled={busy}
          aria-label="+ Görevi Kaydet"
        >
          <TodoIcon name="plus" size={18} />
          Görevi kaydet
        </button>
      </form>
    </section>
  );
}
