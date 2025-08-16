CREATE TABLE forms (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inprocess', 'completed'))
);

CREATE TABLE form_fields (
  id SERIAL PRIMARY KEY,
  form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN DEFAULT false
);