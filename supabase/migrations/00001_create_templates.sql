-- Story 5.1: Table des modèles de rapprochement réutilisables

CREATE TABLE reconciliation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  description text,
  config jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX uq_reconciliation_templates_user_name
  ON reconciliation_templates(user_id, template_name);

CREATE INDEX idx_reconciliation_templates_user_id
  ON reconciliation_templates(user_id);

ALTER TABLE reconciliation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own templates"
  ON reconciliation_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON reconciliation_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON reconciliation_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON reconciliation_templates FOR DELETE
  USING (auth.uid() = user_id);
