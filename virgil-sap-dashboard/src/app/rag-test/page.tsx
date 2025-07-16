import { RAGTest } from "@/components/rag-test";

export default function RAGTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">RAG System Test</h1>
          <p className="text-gray-600">
            Test the Retrieval-Augmented Generation system that replaces prompt stuffing for AI analysis.
          </p>
        </div>
        
        <RAGTest />
        
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How RAG Works</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <strong>Retrieve:</strong> The system searches the knowledge base for relevant SAP products, industry insights, and best practices based on the company's profile.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <strong>Augment:</strong> Retrieved context is combined with company-specific data to create a focused prompt.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <strong>Generate:</strong> The AI generates analysis using only the most relevant context, resulting in more accurate and focused recommendations.
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-green-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Benefits</h2>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Reduced token usage:</strong> Only relevant context is included in prompts</li>
            <li>• <strong>Improved accuracy:</strong> Recommendations based on semantic similarity</li>
            <li>• <strong>Better scalability:</strong> Knowledge base can be updated independently</li>
            <li>• <strong>Faster performance:</strong> Smaller prompts mean faster response times</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 