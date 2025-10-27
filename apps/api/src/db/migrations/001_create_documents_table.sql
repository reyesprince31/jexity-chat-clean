-- Create documents table for tracking uploaded files
-- This table stores metadata and content hashes to prevent duplicate uploads

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content identification
  content_hash TEXT NOT NULL,
  filename TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  size BIGINT NOT NULL,

  -- Storage information
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,

  -- Processing results
  extracted_text_length INTEGER DEFAULT 0,
  has_embedding BOOLEAN DEFAULT FALSE,
  embedding_dimensions INTEGER,

  -- User association (nullable for flexibility)
  user_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index on content_hash for duplicate detection
-- This enforces that we can only have one document with a given content hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_content_hash
  ON documents(content_hash);

-- Create index on user_id for future per-user queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id
  ON documents(user_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_documents_created_at
  ON documents(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE documents IS 'Stores metadata for uploaded documents with content-based deduplication';
COMMENT ON COLUMN documents.content_hash IS 'SHA-256 hash of file content for duplicate detection';
COMMENT ON COLUMN documents.user_id IS 'Optional user ID for future per-user duplicate checking';
