-- Kanban todos table

CREATE TYPE todo_status AS ENUM ('backlog', 'todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE todo_priority AS ENUM ('urgent', 'high', 'medium', 'low', 'none');

CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status todo_status NOT NULL DEFAULT 'backlog',
  priority todo_priority NOT NULL DEFAULT 'none',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_todos_user_status ON todos(user_id, status);
CREATE INDEX idx_todos_sort_order ON todos(user_id, status, sort_order);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);
