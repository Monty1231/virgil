# RAG Implementation for Virgil SAP Dashboard

This document describes the implementation of Retrieval-Augmented Generation (RAG) to replace the previous prompt stuffing approach for AI report generation.

## Overview

The RAG system enhances AI analysis by:

1. **Retrieving relevant context** from a knowledge base instead of stuffing all data into prompts
2. **Using vector embeddings** to find the most relevant SAP products, industry insights, and best practices
3. **Generating more focused and accurate** recommendations based on retrieved context
4. **Improving scalability** by reducing prompt size and token usage

## Architecture

### Core Components

1. **Embedding Service** (`src/lib/embeddings.ts`)

   - Converts text to vector embeddings using OpenAI's text-embedding-3-small
   - Handles text chunking for optimal retrieval
   - Provides similarity calculations

2. **Vector Database** (`src/lib/vector-db.ts`)

   - Manages Pinecone vector database operations
   - Handles index creation, upserting, and searching
   - Provides filtering and metadata support

3. **Knowledge Base** (`src/lib/knowledge-base.ts`)

   - Manages SAP product information and industry data
   - Creates and maintains knowledge chunks
   - Provides specialized retrieval methods

4. **RAG Service** (`src/lib/rag-service.ts`)
   - Orchestrates the retrieval and generation process
   - Builds context prompts from retrieved information
   - Generates analysis using RAG approach

### API Endpoints

1. **RAG Initialization** (`/api/rag/init`)

   - POST: Initialize knowledge base and populate with data
   - GET: Check knowledge base status

2. **RAG Analysis** (`/api/ai-analysis/company/[companyId]/rag`)
   - GET: Generate AI analysis using RAG approach

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env.local`:

```bash
# OpenAI API Key (for embeddings and generation)
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=virgil-sap-knowledge

# Database (existing)
DATABASE_URL=your_database_url_here
```

### 2. Install Dependencies

```bash
npm install @pinecone-database/pinecone openai
```

### 3. Run Database Migration

```bash
npm run migrate
```

This will add the necessary database tables for embeddings and RAG metadata.

### 4. Initialize Knowledge Base

```bash
# Via API
curl -X POST http://localhost:3000/api/rag/init

# Or use the test component in the UI
```

## Usage

### Testing the RAG System

1. **Add the test component to any page:**

```tsx
import { RAGTest } from "@/components/rag-test";

export default function TestPage() {
  return (
    <div>
      <h1>RAG System Test</h1>
      <RAGTest />
    </div>
  );
}
```

2. **Initialize the knowledge base** by clicking "Initialize RAG"
3. **Check status** to verify the knowledge base is populated
4. **Test RAG analysis** to generate an analysis using the new approach

### Generating RAG Analysis

```typescript
// Example API call
const response = await fetch(`/api/ai-analysis/company/${companyId}/rag`);
const result = await response.json();

if (result.success) {
  console.log("Analysis:", result.analysis);
  console.log("Metadata:", result.metadata);
}
```

## Knowledge Base Content

The knowledge base includes:

### SAP Products

- Product descriptions and features
- Target industries and use cases
- Implementation complexity and ROI data
- Cost ranges and time-to-value estimates

### Industry Context

- Industry-specific challenges and trends
- SAP solutions for each industry
- Success stories and best practices
- Implementation guidance

### Best Practices

- SAP implementation methodologies
- ROI optimization strategies
- Change management approaches
- Risk mitigation techniques

## Benefits of RAG Approach

### 1. **Reduced Token Usage**

- Instead of stuffing all SAP products and industry data into prompts
- Only relevant context is retrieved and included
- Significant cost savings on API calls

### 2. **Improved Accuracy**

- Context is retrieved based on semantic similarity
- More relevant and up-to-date information
- Better alignment with company-specific needs

### 3. **Enhanced Scalability**

- Knowledge base can be updated independently
- New SAP products can be added without code changes
- Industry insights can be refreshed regularly

### 4. **Better Performance**

- Faster response times due to smaller prompts
- More focused and relevant recommendations
- Reduced risk of context window limitations

## Comparison: Prompt Stuffing vs RAG

### Before (Prompt Stuffing)

```typescript
// All data stuffed into prompt
const prompt = `
COMPANY PROFILE: ${companyData}
ALL SAP PRODUCTS: ${allSapProducts} // 50+ products
ALL INDUSTRY DATA: ${allIndustryData} // 1000+ lines
UPLOADED FILES: ${fileContent} // Potentially large
... // 10,000+ tokens
`;
```

### After (RAG)

```typescript
// Only relevant context retrieved
const relevantContext = await knowledgeBase.searchRelevantContext(query);
const prompt = `
COMPANY PROFILE: ${companyData}
RELEVANT SAP PRODUCTS: ${relevantContext.products} // 3-5 products
INDUSTRY INSIGHTS: ${relevantContext.insights} // 2-3 insights
IMPLEMENTATION GUIDANCE: ${relevantContext.guidance} // 1-2 practices
UPLOADED FILES: ${fileContent}
... // 2,000-3,000 tokens
`;
```

## Monitoring and Maintenance

### Knowledge Base Health

- Monitor vector count and index performance
- Check retrieval relevance scores
- Update knowledge base content regularly

### Performance Metrics

- Track API response times
- Monitor token usage reduction
- Measure analysis quality improvements

### Content Updates

- Add new SAP products to the knowledge base
- Update industry trends and best practices
- Refresh success stories and case studies

## Troubleshooting

### Common Issues

1. **Pinecone Connection Errors**

   - Verify API key and index name
   - Check Pinecone service status
   - Ensure index exists and is ready

2. **Embedding Generation Failures**

   - Verify OpenAI API key
   - Check API rate limits
   - Monitor token usage

3. **Knowledge Base Initialization Failures**
   - Check database connectivity
   - Verify SAP products table exists
   - Monitor migration status

### Debug Commands

```bash
# Check knowledge base status
curl http://localhost:3000/api/rag/init

# Test RAG analysis
curl http://localhost:3000/api/ai-analysis/company/1/rag

# Check database tables
psql $DATABASE_URL -c "\dt"
```

## Future Enhancements

1. **Hybrid Search**: Combine semantic and keyword search
2. **Dynamic Updates**: Real-time knowledge base updates
3. **Multi-modal RAG**: Support for images and documents
4. **Personalization**: User-specific knowledge base customization
5. **Analytics**: Detailed retrieval and generation analytics

## Support

For issues or questions about the RAG implementation:

1. Check the troubleshooting section above
2. Review the API logs for error details
3. Verify environment variables and dependencies
4. Test with the provided test component
