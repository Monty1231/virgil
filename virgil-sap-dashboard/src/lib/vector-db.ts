import { Pinecone } from "@pinecone-database/pinecone";
import { embeddingService, EmbeddingChunk } from "./embeddings";

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

export class VectorDatabase {
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.indexName = process.env.PINECONE_INDEX_NAME || "virgil-sap-knowledge";
  }

  async initialize() {
    try {
      // Try to get the index directly - if it doesn't exist, this will throw an error
      try {
        await this.pinecone.describeIndex(this.indexName);
        console.log(`Using existing Pinecone index: ${this.indexName}`);
        return;
      } catch (error) {
        // Index doesn't exist, create it
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI text-embedding-3-small dimension
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        });
        // Wait for index to be ready
        await this.waitForIndex();
        console.log(`Created and ready Pinecone index: ${this.indexName}`);
      }
    } catch (error) {
      console.error("Error initializing vector database:", error);
      throw error;
    }
  }

  private async waitForIndex() {
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      try {
        const { status } = await this.pinecone.describeIndex(this.indexName);
        if (status?.ready) {
          console.log("Index is ready");
          return;
        }
      } catch (error) {
        // Index might not be ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
    throw new Error("Index initialization timeout");
  }

  async upsertChunks(chunks: EmbeddingChunk[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      // Generate embeddings for chunks that don't have them
      const chunksToEmbed = chunks.filter((chunk) => !chunk.embedding);
      if (chunksToEmbed.length > 0) {
        const texts = chunksToEmbed.map((chunk) => chunk.content);
        const embeddings = await embeddingService.generateEmbeddings(texts);
        chunksToEmbed.forEach((chunk, i) => {
          chunk.embedding = embeddings[i];
        });
      }
      // Prepare vectors for Pinecone
      const vectors = chunks.map((chunk) => ({
        id: chunk.id,
        values: chunk.embedding!,
        metadata: {
          content: chunk.content,
          ...chunk.metadata,
        },
      }));
      // Upsert in batches
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
      }
      console.log(`Upserted ${vectors.length} vectors to Pinecone`);
    } catch (error) {
      console.error("Error upserting chunks:", error);
      throw error;
    }
  }

  async search(
    query: string,
    topK: number = 10,
    filter?: Record<string, any>
  ): Promise<VectorSearchResult[]> {
    try {
      const index = this.pinecone.index(this.indexName);
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter,
      });
      return (searchResponse.matches || []).map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        content: (match.metadata?.content as string) || "",
        metadata: match.metadata || {},
      }));
    } catch (error) {
      console.error("Error searching vectors:", error);
      throw error;
    }
  }

  async deleteChunks(ids: string[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      await index.deleteMany(ids);
      console.log(`Deleted ${ids.length} vectors from Pinecone`);
    } catch (error) {
      console.error("Error deleting chunks:", error);
      throw error;
    }
  }

  async getIndexStats() {
    try {
      return await this.pinecone.describeIndex(this.indexName);
    } catch (error) {
      console.error("Error getting index stats:", error);
      throw error;
    }
  }

  getIndexName(): string {
    return this.indexName;
  }
}

export const vectorDb = new VectorDatabase();
 