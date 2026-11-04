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
};
export default function TodoCreateForm({
  busy,
  newTodo,
  setNewTodo,
  createErrors,
  handleCreateTodo,
}: Props) {
  return (
    <section className="todo-composer" aria-labelledby="create-heading">
      <div className="composer-heading">
        <span className="composer-symbol">
          <TodoIcon name="plus" />
        </span>
        <div>
          <h2 id="create-heading">Yeni bir başlangıç</h2>
          <p>Aklındakini bir adıma dönüştür.</p>
        </div>
      </div>
      <form onSubmit={handleCreateTodo} noValidate>
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
      <div className="composer-note">
        <TodoIcon name="leaf" size={17} />
        <p>Büyük işler, küçük adımlarla başlar.</p>
      </div>
    </section>
  );
}
