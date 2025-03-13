// Test script for workflow node ID validation
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const API_URL = 'http://localhost:5000/api';

// Get deployment ID from arguments or use default
const getDeploymentId = () => {
  // Check if --deployment-id=X arg is provided
  const deploymentArg = process.argv.find(arg => arg.startsWith('--deployment-id='));
  if (deploymentArg) {
    const id = parseInt(deploymentArg.split('=')[1]);
    if (!isNaN(id)) {
      return id;
    }
  }
  return 1; // Default deployment ID
};

const DEPLOYMENT_ID = getDeploymentId();
console.log(`Using deployment ID: ${DEPLOYMENT_ID}`);

// Create a properly formatted token
const JWT_SECRET = 'xedge_secret_key_for_jwt_tokens'; // Same as in .env
const payload = {
  user: {
    id: 1,
    username: 'admin'
  }
};
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
console.log('Generated token:', token);

// First, check if the server is running and the deployment exists
async function checkServerAndDeployment() {
  console.log('Checking if server is running and deployment exists...');
  
  try {
    // Check server status
    console.log('Checking server status...');
    const statusResponse = await axios.get('http://localhost:5000/', { timeout: 3000 });
    console.log('Server status:', statusResponse.status, statusResponse.data);
    
    // Check if deployment exists
    console.log(`Checking if deployment ${DEPLOYMENT_ID} exists...`);
    
    const deploymentResponse = await axios.get(
      `${API_URL}/deployments/${DEPLOYMENT_ID}`,
      { 
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    console.log('Deployment response:', deploymentResponse.status, deploymentResponse.data);
    
    return true;
  } catch (error) {
    console.log('❌ Server or deployment check failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      console.log('Headers sent:', JSON.stringify(error.config?.headers, null, 2));
    } else if (error.request) {
      console.log('No response received. Request details:', error.message);
    } else {
      console.log('Error message:', error.message);
    }
    return false;
  }
}

// Test valid workflow (all nodes have IDs)
async function testValidWorkflow() {
  console.log('Testing valid workflow (all nodes have IDs)...');
  try {
    // Valid workflow - all nodes have IDs
    const validWorkflow = {
      elements: [
        { id: 'node-1', type: 'httpRequest', position: { x: 100, y: 100 }, data: { label: 'HTTP Request' } },
        { id: 'node-2', type: 'transformer', position: { x: 300, y: 200 }, data: { label: 'Transform Data' } }
      ]
    };
    
    console.log(`Making PUT request to ${API_URL}/deployments/${DEPLOYMENT_ID}/workflow`);
    console.log('Request payload:', JSON.stringify(validWorkflow, null, 2));
    
    const response = await axios.put(
      `${API_URL}/deployments/${DEPLOYMENT_ID}/workflow`,
      validWorkflow,
      { 
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    console.log('Valid workflow response:', response.status, response.data);
    console.log('✅ Valid workflow test passed - workflow was saved successfully');
    return true;
  } catch (error) {
    console.log('❌ Valid workflow test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      console.log('Headers sent:', JSON.stringify(error.config?.headers, null, 2));
    } else if (error.request) {
      console.log('No response received. Request details:', error.message);
    } else {
      console.log('Error message:', error.message);
    }
    return false;
  }
}

// Test invalid workflow (missing node ID)
async function testInvalidWorkflow() {
  console.log('Testing invalid workflow (missing node ID)...');
  try {
    // Invalid workflow - one node is missing ID
    const invalidWorkflow = {
      elements: [
        { id: 'node-1', type: 'httpRequest', position: { x: 100, y: 100 }, data: { label: 'HTTP Request' } },
        { type: 'transformer', position: { x: 300, y: 200 }, data: { label: 'Transform Data' } } // Missing ID
      ]
    };
    
    console.log(`Making PUT request to ${API_URL}/deployments/${DEPLOYMENT_ID}/workflow`);
    console.log('Request payload:', JSON.stringify(invalidWorkflow, null, 2));
    
    const response = await axios.put(
      `${API_URL}/deployments/${DEPLOYMENT_ID}/workflow`,
      invalidWorkflow,
      { 
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    console.log('Invalid workflow unexpected response:', response.status, response.data);
    console.log('❌ Test failed - server accepted invalid workflow');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Test passed - server rejected the invalid workflow');
      console.log('Response:', error.response.status, error.response.data);
      return true;
    } else {
      console.log('❌ Test failed with unexpected error:');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
        console.log('Headers sent:', JSON.stringify(error.config?.headers, null, 2));
      } else if (error.request) {
        console.log('No response received. Request details:', error.message);
        console.log('Error code:', error.code);
        console.log('Error name:', error.name);
      } else {
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
      }
      return false;
    }
  }
}

// Run tests
async function runTests() {
  console.log('Starting workflow validation tests...');
  try {
    // First check if server is running and deployment exists
    const serverAndDeploymentOk = await checkServerAndDeployment();
    if (!serverAndDeploymentOk) {
      console.log('❌ Server or deployment check failed. Skipping workflow tests.');
      return;
    }
    
    // Test valid workflow
    console.log('\n=== Testing Valid Workflow ===');
    const validResult = await testValidWorkflow();
    
    // Test invalid workflow
    console.log('\n=== Testing Invalid Workflow ===');
    const invalidResult = await testInvalidWorkflow();
    
    console.log('\n=== Test Summary ===');
    console.log('Valid workflow test:', validResult ? '✅ PASSED' : '❌ FAILED');
    console.log('Invalid workflow test:', invalidResult ? '✅ PASSED' : '❌ FAILED');
    console.log('Tests completed!');
  } catch (error) {
    console.error('Test error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

runTests(); 