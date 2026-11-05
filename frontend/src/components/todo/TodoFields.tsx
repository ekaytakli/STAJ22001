import type { ReactNode, RefObject } from "react";
import type { Priority } from "../../types";
import type { FormErrors, TodoForm } from "./todoHelpers";
import { FIELD_LIMIT } from "./todoHelpers";
import FieldFeedback from "./FieldFeedback";

function AdditionalFields({ children, collapsed, expanded }: { children: ReactNode; collapsed: boolean; expanded: boolean }) {
  if (!collapsed) return <div className="todo-additional-fields">{children}</div>;
  return <details className="task-extra-fields" open={expanded || undefined}>
    <summary>Not, tarih veya kategori ekle</summary>
    <div className="todo-additional-fields">{children}</div>
  </details>;
}

type Props = {
  prefix: "create" | "edit";
  values: TodoForm;
  onChange: (values: TodoForm) => void;
  errors: FormErrors;
  busy: boolean;
  titleRef?: RefObject<HTMLInputElement | null>;
};
export default function TodoFields({
  prefix,
  values,
  onChange,
  errors,
  busy,
  titleRef,
}: Props) {
  return (
    <div className="todo-fields">
      <div className="todo-field">
        <label htmlFor={prefix + "-title"}>
          Görev başlığı <span aria-hidden="true">*</span>
        </label>
        <input
          ref={titleRef}
          id={prefix + "-title"}
          className="form-control"
          aria-label="Başlık"
          placeholder="Aklındaki bir sonraki adım…"
          disabled={busy}
          required
          maxLength={FIELD_LIMIT}
          value={values.title}
          onChange={(event) =>
            onChange({ ...values, title: event.target.value })
          }
          aria-invalid={Boolean(errors.title)}
          aria-describedby={prefix + "-title-feedback"}
        />
        <FieldFeedback
          id={prefix + "-title-feedback"}
          value={values.title}
          error={errors.title}
        />
      </div>
      <AdditionalFields collapsed={prefix === "create"} expanded={Boolean(
        values.description || values.dueDate || values.category !== "Genel" || values.priority !== "MEDIUM" ||
        errors.description || errors.category || errors.dueDate || errors.priority
      )}>
      <div className="todo-field">
        <label htmlFor={prefix + "-description"}>
          Notlar <span className="field-optional">isteğe bağlı</span>
        </label>
        <textarea
          id={prefix + "-description"}
          className="form-control"
          aria-label="Açıklama"
          placeholder="Küçük bir detay, büyük bir kolaylık."
          rows={3}
          disabled={busy}
          maxLength={FIELD_LIMIT}
          value={values.description}
          onChange={(event) =>
            onChange({ ...values, description: event.target.value })
          }
          aria-invalid={Boolean(errors.description)}
          aria-describedby={prefix + "-description-feedback"}
        />
        <FieldFeedback
          id={prefix + "-description-feedback"}
          value={values.description}
          error={errors.description}
        />
      </div>
      <div className="todo-field-pair">
        <div className="todo-field">
          <label htmlFor={prefix + "-priority"}>Öncelik</label>
          <select
            id={prefix + "-priority"}
            className="form-select"
            disabled={busy}
            value={values.priority}
            onChange={(event) =>
              onChange({ ...values, priority: event.target.value as Priority })
            }
          >
            <option value="LOW">Düşük</option>
            <option value="MEDIUM">Orta</option>
            <option value="HIGH">Yüksek</option>
          </select>
        </div>
        <div className="todo-field">
          <label htmlFor={prefix + "-category"}>Kategori</label>
          <input
            id={prefix + "-category"}
            className="form-control"
            aria-label="Kategori"
            list="todo-category-options"
            disabled={busy}
            maxLength={FIELD_LIMIT}
            required
            value={values.category}
            onChange={(event) =>
              onChange({ ...values, category: event.target.value })
            }
            aria-invalid={Boolean(errors.category)}
            aria-describedby={prefix + "-category-feedback"}
          />
          <FieldFeedback
            id={prefix + "-category-feedback"}
            value={values.category}
            error={errors.category}
          />
        </div>
      </div>
      <div className="todo-field">
        <label htmlFor={prefix + "-due-date"}>
          Son teslim tarihi <span className="field-optional">isteğe bağlı</span>
        </label>
        <input
          id={prefix + "-due-date"}
          className="form-control"
          type="date"
          max="9999-12-31"
          disabled={busy}
          value={values.dueDate}
          onChange={(event) =>
            onChange({ ...values, dueDate: event.target.value })
          }
          aria-invalid={Boolean(errors.dueDate)}
          aria-describedby={prefix + "-due-error"}
        />
        {errors.dueDate && (
          <p id={prefix + "-due-error"} className="field-error" role="alert">
            {errors.dueDate}
          </p>
        )}
      </div>
      </AdditionalFields>
    </div>
  );
}
