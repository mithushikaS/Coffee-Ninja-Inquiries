CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('staff', 'manager')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inquiries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 100),
  contact       TEXT NOT NULL CHECK (char_length(contact) BETWEEN 3 AND 200),
  subject       TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 150),
  description   TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  status        TEXT NOT NULL DEFAULT 'New'
                CHECK (status IN ('New', 'In Progress', 'Resolved')),
  version       INTEGER NOT NULL DEFAULT 1,
  created_by    INTEGER NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_owner_status ON inquiries (created_by, status);
CREATE INDEX idx_inquiries_created_at ON inquiries (created_at DESC);

-- Duplicate policy enforced by the database itself:
-- same owner + same contact + same subject (case-insensitive) while not Resolved.
CREATE UNIQUE INDEX uq_inquiries_open_duplicate
  ON inquiries (created_by, lower(contact), lower(subject))
  WHERE status <> 'Resolved';