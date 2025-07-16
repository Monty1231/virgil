import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingChunk {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export class EmbeddingService {
  private model = 'text-embedding-3-small';

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await openai.embeddings.create({
        model: this.model,
        input: texts,
        encoding_format: 'float',
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  // Split text into chunks for better retrieval
  splitTextIntoChunks(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + maxChunkSize, text.length);
      let chunk = text.slice(start, end);

      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + maxChunkSize * 0.7) {
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }

      chunks.push(chunk.trim());
      start = end - overlap;
    }

    return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const embeddingService = new EmbeddingService(); 