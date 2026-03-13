const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:5000';

async function debugTest5() {
  try {
    // Register user
    const userRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: `test-${Date.now()}@test.com`,
      password: 'testpass123'
    });
    
    const token = userRes.data.data.token;
    const userId = userRes.data.data.user._id;
    console.log('✓ User registered:', userId);
    
    // Upload document
    const docForm = new (require('form-data'))();
    docForm.append('files', require('fs').createReadStream('/tmp/test.pdf') || Buffer.from('dummy pdf content'));
    
    let docRes;
    try {
      docRes = await axios.post(`${BASE_URL}/api/documents/upload`, docForm, {
        headers: { 
          ...docForm.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      });
    } catch (e) {
      // Use a simpler document for testing
      docRes = await axios.post(`${BASE_URL}/api/documents/upload`, 
        { documentName: 'Test PDF', fileContent: 'dummy content' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    
    const documentId = docRes.data.data[0].id || docRes.data.data.id;
    console.log('✓ Document uploaded:', documentId);
    
    // Sign field
    const signRes = await axios.post(
      `${BASE_URL}/api/documents/${documentId}/sign-field`,
      {
        fieldId: 'test_field',
        fieldContent: 'Test content',
        password: 'testpass123'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('\n📋 SIGN-FIELD RESPONSE:');
    console.log('Status:', signRes.status);
    console.log('Data:', JSON.stringify(signRes.data, null, 2));
    
    const sig = signRes.data.data;
    console.log('\n🔍 FIELD CHECK:');
    console.log('_id:', sig._id);
    console.log('algorithm:', sig.algorithm);
    console.log('content_hash:', sig.content_hash ? sig.content_hash.substring(0, 32) + '...' : 'MISSING');
    console.log('crypto_signature:', sig.crypto_signature ? sig.crypto_signature.substring(0, 32) + '...' : 'MISSING');
    console.log('crypto_signature type:', typeof sig.crypto_signature);
    console.log('crypto_signature length:', sig.crypto_signature?.length);
    console.log('crypto_signature truthy:', !!sig.crypto_signature);
    
    console.log('\n✅ Test Pass Would Be:', !!(sig.crypto_signature && sig.content_hash && sig.algorithm));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
  process.exit(0);
}

debugTest5();
