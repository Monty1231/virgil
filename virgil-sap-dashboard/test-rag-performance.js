// Test script to verify RAG performance optimizations
const testRagPerformance = async () => {
  console.log('🧪 Testing RAG Performance Optimizations...\n');

  // Test 1: Company creation speed
  console.log('1. Testing company creation speed...');
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Test Company ${Date.now()}`,
        industry: 'Technology',
        company_size: 'Medium (101-1000 employees)',
        region: 'North America',
        website: 'https://testcompany.com',
        business_challenges: 'Need to improve customer experience and streamline operations',
        current_systems: 'Legacy CRM and ERP systems',
        budget: '$500K - $1M',
        timeline: '6-12 months',
        priority: 'medium',
        primary_contact: {
          name: 'John Doe',
          title: 'CTO',
          email: 'john@testcompany.com',
          phone: '+1-555-0123'
        },
        notes: 'Test company for performance validation',
        tags: ['test', 'performance'],
        uploaded_files: []
      })
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.ok) {
      const company = await response.json();
      console.log(`✅ Company created successfully in ${duration}ms`);
      console.log(`   Company ID: ${company.id}`);
      console.log(`   Expected: < 3000ms, Actual: ${duration}ms`);
      
      if (duration < 3000) {
        console.log('   ✅ Performance: EXCELLENT - Async RAG processing working');
      } else if (duration < 5000) {
        console.log('   ⚠️  Performance: GOOD - Some delay but acceptable');
      } else {
        console.log('   ❌ Performance: POOR - RAG processing may be blocking');
      }
    } else {
      console.log('❌ Failed to create company');
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log('❌ Error during test:', error.message);
  }

  // Test 2: Check RAG system status
  console.log('\n2. Checking RAG system status...');
  try {
    const statusResponse = await fetch('http://localhost:3000/api/rag/status');
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ RAG system status:');
      console.log(`   Initialized: ${status.initialized}`);
      console.log(`   Total chunks: ${status.totalChunks}`);
      console.log(`   SAP products: ${status.sapProducts}`);
      console.log(`   Industry contexts: ${status.industryContexts}`);
    } else {
      console.log('❌ Failed to get RAG status');
    }
  } catch (error) {
    console.log('❌ Error checking RAG status:', error.message);
  }

  // Test 3: Test knowledge base optimization
  console.log('\n3. Testing knowledge base optimizations...');
  try {
    const kbResponse = await fetch('http://localhost:3000/api/rag/initialize');
    if (kbResponse.ok) {
      const result = await kbResponse.json();
      console.log('✅ Knowledge base optimization test:');
      console.log(`   Chunks added: ${result.chunksAdded}`);
      console.log(`   Processing time: ${result.processingTime}ms`);
      
      if (result.processingTime < 10000) {
        console.log('   ✅ Optimization: EXCELLENT - Fast processing');
      } else if (result.processingTime < 20000) {
        console.log('   ⚠️  Optimization: GOOD - Acceptable processing time');
      } else {
        console.log('   ❌ Optimization: POOR - Slow processing');
      }
    } else {
      console.log('❌ Failed to test knowledge base');
    }
  } catch (error) {
    console.log('❌ Error testing knowledge base:', error.message);
  }

  console.log('\n🎯 Performance Test Summary:');
  console.log('- Company creation should complete in < 3 seconds');
  console.log('- RAG processing happens asynchronously in background');
  console.log('- User sees success message immediately');
  console.log('- Background processing indicator shows for 30 seconds');
  console.log('- Optimized chunk sizes and file processing limits');
};

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testRagPerformance().catch(console.error);
}

module.exports = { testRagPerformance }; 