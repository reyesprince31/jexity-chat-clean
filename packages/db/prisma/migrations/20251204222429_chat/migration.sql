-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content_hash" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "extracted_text" TEXT,
    "extracted_text_length" INTEGER DEFAULT 0,
    "has_embedding" BOOLEAN DEFAULT false,
    "user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "embedding" vector,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER,
    "embedding" vector,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT,
    "is_escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalated_reason" TEXT,
    "escalated_at" TIMESTAMPTZ(6),
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" TEXT,
    "agent_name" TEXT,
    "agent_joined_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "chunk_id" UUID NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idx_documents_content_hash" ON "documents"("content_hash");

-- CreateIndex
CREATE INDEX "idx_documents_created_at" ON "documents"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_documents_user_id" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "idx_document_chunks_document_id" ON "document_chunks"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_document_chunks_unique" ON "document_chunks"("document_id", "chunk_index");

-- CreateIndex
CREATE INDEX "idx_conversations_created_at" ON "conversations"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_conversations_updated_at" ON "conversations"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_conversations_resolved" ON "conversations"("is_resolved", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_messages_conversation_id" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_messages_created_at" ON "messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_message_sources_message_id" ON "message_sources"("message_id");

-- CreateIndex
CREATE INDEX "idx_message_sources_chunk_id" ON "message_sources"("chunk_id");

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_sources" ADD CONSTRAINT "message_sources_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_sources" ADD CONSTRAINT "message_sources_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "document_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
