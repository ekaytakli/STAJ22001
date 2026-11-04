-- Equality on the owner, then the stable order used by the default list.
CREATE INDEX IF NOT EXISTS idx_todos_user_id_desc ON todos (user_id, id DESC);
-- Status tabs and counts retain the same stable order within each owner/status.
CREATE INDEX IF NOT EXISTS idx_todos_user_completed_id_desc ON todos (user_id, completed, id DESC);
-- Match the nulls-last expression used by the due-date sort.
CREATE INDEX IF NOT EXISTS idx_todos_user_due_date ON todos (
    user_id, (CASE WHEN due_date IS NULL THEN 1 ELSE 0 END), due_date, id DESC
);
