// Simple script to test if the server is running
const axios = require('axios');

// Try different ports
const ports = [3000, 5000, 8000, 8080];

// Try different endpoints
const endpoints = [
  '/api/status',
  '/api/health',
  '/api',
  '/api/deployments',
  '/api/plugins'
];

async function testEndpoint(port, endpoint) {
  try {
    console.log(`Testing ${endpoint} on port ${port}...`);
    const response = await axios.get(`http://localhost:${port}${endpoint}`, { timeout: 2000 });
    console.log(`✅ Endpoint ${endpoint} is available on port ${port}!`);
    console.log('Response:', response.status, response.data);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ No server running on port ${port}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`❌ Connection timed out on port ${port}`);
    } else {
      console.log(`❌ Error on port ${port}, endpoint ${endpoint}:`, error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
      }
    }
    return false;
  }
}

async function testPort(port) {
  console.log(`\nTesting server on port ${port}...`);
  
  for (const endpoint of endpoints) {
    if (await testEndpoint(port, endpoint)) {
      return true;
    }
  }
  
  return false;
}

async function main() {
  console.log('Testing if server is running...');
  
  let serverFound = false;
  for (const port of ports) {
    if (await testPort(port)) {
      serverFound = true;
      break;
    }
  }
  
  if (!serverFound) {
    console.log('\n❌ Server not found on any of the tested ports and endpoints.');
    console.log('Please make sure the server is running.');
  }
}

main().catch(console.error); 