ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS responder_id TEXT;

CREATE INDEX IF NOT EXISTS idx_responses_responder_id ON responses(responder_id);