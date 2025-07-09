// Test Salesforce Connection
require('dotenv').config({ path: '.env.local' });

console.log('Testing Salesforce Connection...\n');

// Check environment variables
const requiredVars = [
  'SALESFORCE_INSTANCE_URL',
  'SALESFORCE_ACCESS_TOKEN',
  'SALESFORCE_REFRESH_TOKEN',
  'SALESFORCE_CLIENT_ID',
  'SALESFORCE_CLIENT_SECRET'
];

console.log('Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ SET' : '❌ NOT SET';
  const displayValue = value ? `${value.substring(0, 20)}...` : 'undefined';
  console.log(`${varName}: ${status} (${displayValue})`);
});

console.log('\nTesting API Connection...');

// Test the Salesforce API endpoint
async function testConnection() {
  try {
    const response = await fetch('http://localhost:3000/api/commissions/export-to-salesforce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        deal_id: 1,
        deal_name: 'Test Deal',
        deal_value: 100000,
        commission_rate: 10,
        commission_amount: 10000,
        submission_status: 'pending',
        submission_date: new Date().toISOString(),
        notes: 'Test commission export',
        submitted_by: 1
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Salesforce connection successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Salesforce connection failed');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

// Wait a moment for the server to start, then test
setTimeout(testConnection, 3000); 