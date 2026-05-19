/*
  # Add agent_id to consultations for multi-tenant lead routing
*/

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS agent_id text;

CREATE INDEX IF NOT EXISTS consultations_agent_id_idx ON consultations (agent_id);
