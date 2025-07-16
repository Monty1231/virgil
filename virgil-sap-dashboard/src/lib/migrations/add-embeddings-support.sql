-- Migration: Add embeddings and RAG support
-- This migration adds support for vector embeddings and RAG metadata

-- Add embeddings table for storing document embeddings
CREATE TABLE IF NOT EXISTS document_embeddings (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  content_chunk TEXT NOT NULL,
  embedding_vector REAL[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for document embeddings
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id 
ON document_embeddings(document_id);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_type 
ON document_embeddings(document_type);

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_document_embeddings_metadata 
ON document_embeddings USING GIN(metadata);

-- Add RAG metadata columns to ai_analyses table
ALTER TABLE ai_analyses 
ADD COLUMN IF NOT EXISTS rag_metadata JSONB,
ADD COLUMN IF NOT EXISTS retrieval_context JSONB;

-- Add index for RAG metadata queries
CREATE INDEX IF NOT EXISTS idx_ai_analyses_rag_metadata 
ON ai_analyses USING GIN(rag_metadata);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_retrieval_context 
ON ai_analyses USING GIN(retrieval_context);

-- Add comments to document the new columns
COMMENT ON COLUMN ai_analyses.rag_metadata IS 'RAG-specific metadata including retrieval sources and methods';
COMMENT ON COLUMN ai_analyses.retrieval_context IS 'Context retrieved from knowledge base for this analysis';
COMMENT ON COLUMN document_embeddings.embedding_vector IS 'Vector embedding of the content chunk';
COMMENT ON COLUMN document_embeddings.metadata IS 'Additional metadata for the embedding chunk'; 