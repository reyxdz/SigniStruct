/**
 * Quick API Endpoint Diagnostic Test
 * Check which endpoints are working and what response formats they have
 */

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:5000';

async function testEndpoint(method, endpoint, data = null, headers = {}) {
  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(`${BASE_URL}${endpoint}`, { headers });
    } else if (method === 'POST') {
      response = await axios.post(`${BASE_URL}${endpoint}`, data, { headers });
    }
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: Object.keys(response.headers)
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'N/A',
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    };
  }
}

async function runDiagnostics() {
  console.log(`\n🔍 API Endpoint Diagnostics`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  // Test 1: Health check
  console.log('1️⃣  Testing Health Endpoint');
  const health = await testEndpoint('GET', '/api/health');
  console.log('   Status:', health.status);
  console.log('   Response:', JSON.stringify(health.data || health.message, null, 2));
  
  // Test 2: Signup
  console.log('\n2️⃣  Testing Signup Endpoint');
  const signupData = {
    firstName: 'Test',
    lastName: `User${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    phone: '639123456789',
    address: 'Test Address',
    password: 'TestPassword@123',
    confirmPassword: 'TestPassword@123'
  };
  const signup = await testEndpoint('POST', '/api/auth/signup', signupData);
  console.log('   Status:', signup.status);
  console.log('   Response:', JSON.stringify(signup.data || signup.message, null, 2).substring(0, 500));
  
  if (signup.success) {
    const user = signup.data.data || signup.data;
    console.log('   User ID:', user._id);
    console.log('   Token:', user.token ? 'YES' : 'NO');
    console.log('   Email:', user.email);
    
    // Test 3: Get user documents
    if (user.token) {
      console.log('\n3️⃣  Testing Get Documents Endpoint');
      const docs = await testEndpoint('GET', '/api/documents/', null, {
        Authorization: `Bearer ${user.token}`
      });
      console.log('   Status:', docs.status);
      console.log('   Response:', JSON.stringify(docs.data || docs.message, null, 2).substring(0, 500));
    }
  }
  
  console.log('\n✅ Diagnostics Complete');
}

runDiagnostics();
