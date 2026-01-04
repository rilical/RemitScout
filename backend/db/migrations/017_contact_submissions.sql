-- Contact form submissions table for Plane A
CREATE TABLE IF NOT EXISTS silver.contact_submissions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_error TEXT
);

CREATE INDEX IF NOT EXISTS contact_submissions_email_idx ON silver.contact_submissions(email);
CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx ON silver.contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS contact_submissions_email_sent_idx ON silver.contact_submissions(email_sent);

-- Grant permissions to plane_a
GRANT INSERT, SELECT ON silver.contact_submissions TO plane_a;
GRANT USAGE, SELECT ON SEQUENCE silver.contact_submissions_id_seq TO plane_a;


