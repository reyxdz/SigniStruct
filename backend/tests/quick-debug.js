const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function quickDebug() {
  try {
    // Create test data first
    const userRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: `Test User ${Date.now()}`,
      email: `test-${Date.now()}@test.com`,
      password: 'testpass123'
    });
    
    const token = userRes.data.data.token;
    const userId = userRes.data.data.user._id;
    
    console.log('✓ User created');
    
    // Upload document
    const docRes = await axios.post(`${BASE_URL}/api/documents/upload`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const documentId = docRes.data.data[0]?._id || docRes.data.data[0]?.id;
    console.log('✓ Document uploaded');
    
    // NOW THE KEY TEST - Sign field
    const signRes = await axios.post(
      `${BASE_URL}/api/documents/${documentId}/sign-field`,
      {
        fieldId: 'test_field',
        fieldContent: 'Test content for signing',
        password: 'testpass123'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const sig = signRes.data.data;
    
    console.log('\n=== FULL RESPONSE DATA ===');
    console.log(JSON.stringify(sig, null, 2));
    
    console.log('\n=== TEST CONDITIONS ===');
    console.log('crypto_signature exists:', !!sig.crypto_signature);
    console.log('content_hash exists:', !!sig.content_hash);
    console.log('algorithm exists:', !!sig.algorithm);
    console.log('\nWould Pass Test:', !!(sig.crypto_signature && sig.content_hash && sig.algorithm));
    
  } catch (error) {
    console.error('Error:', error.response?.data?.error || error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
  process.exit(0);
}

quickDebug();
