# Database Setup

## Running Migrations

This directory contains SQL migrations for the database schema.

### Migration: `001_create_documents_table.sql`

Creates the `documents` table for tracking uploaded files with content-based deduplication.

#### Running the Migration

You have several options to run this migration:

**Option 1: Supabase Dashboard (Recommended for initial setup)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `001_create_documents_table.sql`
4. Click "Run" to execute

**Option 2: Supabase CLI**
```bash
# Make sure you have Supabase CLI installed
# npm install -g supabase

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db execute --file src/db/migrations/001_create_documents_table.sql
```

**Option 3: Using psql directly**
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:[PORT]/postgres" -f src/db/migrations/001_create_documents_table.sql
```

## Schema Overview

### `documents` Table

Stores metadata for all uploaded documents with content-based deduplication.

**Key Columns:**
- `id` (uuid) - Primary key
- `content_hash` (text, unique) - SHA-256 hash of file content for duplicate detection
- `filename` (text) - Original filename
- `mimetype` (text) - File MIME type
- `size` (bigint) - File size in bytes
- `storage_path` (text) - Path in Supabase Storage
- `public_url` (text) - Public URL for accessing the file
- `storage_bucket` (text) - Supabase Storage bucket name
- `extracted_text_length` (integer) - Length of extracted text content
- `has_embedding` (boolean) - Whether embeddings were created
- `embedding_dimensions` (integer) - Dimensionality of the embedding vector
- `user_id` (uuid, nullable) - Optional user ID for per-user duplicate checking
- `created_at` (timestamptz) - When the document was first uploaded
- `updated_at` (timestamptz) - Last update time (auto-updated via trigger)

**Indexes:**
- Unique index on `content_hash` for fast duplicate detection
- Index on `user_id` for per-user queries
- Index on `created_at` for time-based queries

## How Duplicate Detection Works

1. When a file is uploaded, its SHA-256 hash is computed
2. Before processing, the system checks if a document with the same hash exists
3. If found, the existing document metadata is returned (no reprocessing)
4. If not found, the file is processed and a new record is created

This approach:
- Saves storage space (no duplicate files stored)
- Saves processing time (no re-extraction/re-embedding)
- Saves API costs (no duplicate embedding generation)
- Works regardless of filename (content-based)

## Future Enhancements

The schema is designed to support future features:
- **Per-user duplicate checking**: Use the `user_id` column to check duplicates within a user's scope
- **Embedding storage**: Add a `vector` column to store embeddings directly in the database
- **Document versioning**: Track multiple versions of documents with the same hash
