import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Plugin, Deployment, Workflow, ApiResponse, AuthResponse, WorkflowElement } from './types';

// Sample data
import { mockPlugins } from './mock-data/plugins';
import { mockDeployments } from './mock-data/deployments';
import { mockWorkflows } from './mock-data/workflows';

// Create mock adapter instance
const mock = new MockAdapter(axios, { 
  delayResponse: 500,
  onNoMatch: 'passthrough'
});

// Initialize an empty object to store workflows by ID
const workflows: { [key: string]: Workflow } = {};

// Development mode message
// Add a console message to indicate that mock is configured
// console.log('Mock API enabled in development mode');
// console.log('All API requests will be intercepted by mock API');

// Define types for our data structures
interface PluginSetting {
  key: string;
  type: string;
  label: string;
}

// Helper function to get deployments from localStorage or use the initial deployments
function getStoredDeployments(): Deployment[] {
  try {
    const storedDeployments = localStorage.getItem('mockDeployments');
    if (storedDeployments) {
      return JSON.parse(storedDeployments);
    }
  } catch (error) {
    // console.error('Error reading deployments from localStorage:', error);
  }
  return mockDeployments;
}

// Helper function to get workflows from localStorage or use the initial workflows
function getStoredWorkflows(): Record<string, Workflow> {
  try {
    const storedWorkflows = localStorage.getItem('mockWorkflows');
    if (storedWorkflows) {
      return JSON.parse(storedWorkflows);
    }
  } catch (error) {
    // console.error('Error reading workflows from localStorage:', error);
  }
  
  // If nothing in localStorage, save the initial workflows and return them
  localStorage.setItem('mockWorkflows', JSON.stringify(mockWorkflows));
  return mockWorkflows;
}

// Initialize our data from localStorage or defaults
let deployments = getStoredDeployments();
// Assign to the workflows object from stored workflows, don't redeclare with let
Object.assign(workflows, getStoredWorkflows());

// Save deployments to localStorage whenever they change
function saveDeployments() {
  localStorage.setItem('mockDeployments', JSON.stringify(deployments));
}

// Save workflows to localStorage whenever they change
function saveWorkflows() {
  localStorage.setItem('mockWorkflows', JSON.stringify(workflows));
}

// Mock the login endpoint - support both full URL and relative path
mock.onPost('http://localhost:5000/api/auth/login').reply(200, {
  token: 'mock-jwt-token',
  user: { id: '1', name: 'Test User', email: 'test@example.com' }
});
mock.onPost('/api/auth/login').reply(200, {
  token: 'mock-jwt-token',
  user: { id: '1', name: 'Test User', email: 'test@example.com' }
});

// Mock the register endpoint - support both full URL and relative path
mock.onPost('http://localhost:5000/api/auth/register').reply(200, {
  token: 'mock-jwt-token',
  user: { id: '1', name: 'Test User', email: 'test@example.com' }
});
mock.onPost('/api/auth/register').reply(200, {
  token: 'mock-jwt-token',
  user: { id: '1', name: 'Test User', email: 'test@example.com' }
});

// Mock the deployments endpoint - support both full URL and relative path
mock.onGet('http://localhost:5000/api/deployments').reply(200, deployments);
mock.onGet('/api/deployments').reply(200, deployments);

// Mock the deployment details endpoint - support both full URL and relative path
mock.onGet(/http:\/\/localhost:5000\/api\/deployments\/\d+$/).reply((config) => {
  const idStr = config.url?.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : -1; // Convert to number
  const deployment = deployments.find(d => d.id === id);
  return deployment ? [200, deployment] : [404, { message: 'Deployment not found' }];
});
mock.onGet(/\/api\/deployments\/\d+$/).reply((config) => {
  const idStr = config.url?.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : -1; // Convert to number
  const deployment = deployments.find(d => d.id === id);
  return deployment ? [200, deployment] : [404, { message: 'Deployment not found' }];
});

// Mock creating a new deployment - support both full URL and relative path
mock.onPost('http://localhost:5000/api/deployments').reply((config) => {
  const newDeployment = JSON.parse(config.data);
  const id = Date.now(); // Generate a unique ID as a number
  
  const deployment: Deployment = {
    id, // Now a number
    name: newDeployment.name || 'New Deployment',
    host: newDeployment.host || 'localhost',
    port: newDeployment.port || '8000',
    user_id: newDeployment.user_id || 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_username: newDeployment.owner_username || 'admin'
  };
  
  deployments.push(deployment);
  workflows[id.toString()] = { elements: [] }; // Convert to string for workflow key
  
  saveDeployments();
  saveWorkflows();
  
  return [201, deployment];
});
mock.onPost('/api/deployments').reply((config) => {
  const newDeployment = JSON.parse(config.data);
  const id = Date.now(); // Generate a unique ID as a number
  
  const deployment: Deployment = {
    id, // Now a number
    name: newDeployment.name || 'New Deployment',
    host: newDeployment.host || 'localhost',
    port: newDeployment.port || '8000',
    user_id: newDeployment.user_id || 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_username: newDeployment.owner_username || 'admin'
  };
  
  deployments.push(deployment);
  workflows[id.toString()] = { elements: [] }; // Convert to string for workflow key
  
  saveDeployments();
  saveWorkflows();
  
  return [201, deployment];
});

// Mock the plugins endpoint - support both full URL and relative path
mock.onGet('http://localhost:5000/api/plugins').reply(200, mockPlugins);
mock.onGet('/api/plugins').reply(200, mockPlugins);

// Mock the workflow endpoint (GET) - support both full URL and relative path
mock.onGet(/http:\/\/localhost:5000\/api\/deployments\/\d+\/workflow/).reply((config) => {
  console.log('Workflow API called:', config.url);
  const idMatch = /deployments\/(\d+)\/workflow/.exec(config.url || '');
  console.log('Match result:', idMatch);
  
  if (!idMatch) {
    return [404, { message: 'Workflow not found' }];
  }
  
  const id = parseInt(idMatch[1], 10); // Convert to number for comparison
  const workflowId = id.toString(); // Convert back to string for workflows object key
  const workflow = workflows[workflowId] || { elements: [] };
  return [200, workflow];
});
mock.onGet(/\/api\/deployments\/\d+\/workflow/).reply((config) => {
  console.log('Workflow API called:', config.url);
  const idMatch = /deployments\/(\d+)\/workflow/.exec(config.url || '');
  console.log('Match result:', idMatch);
  
  if (!idMatch) {
    return [404, { message: 'Workflow not found' }];
  }
  
  const id = parseInt(idMatch[1], 10); // Convert to number for comparison
  const workflowId = id.toString(); // Convert back to string for workflows object key
  const workflow = workflows[workflowId] || { elements: [] };
  return [200, workflow];
});

// Mock the workflow endpoint (PUT) - support both full URL and relative path
mock.onPut(/http:\/\/localhost:5000\/api\/deployments\/\d+\/workflow/).reply((config) => {
  const idMatch = /deployments\/(\d+)\/workflow/.exec(config.url || '');
  if (!idMatch) {
    return [404, { message: 'Deployment not found' }];
  }
  
  const id = parseInt(idMatch[1], 10); // Convert to number
  const deploymentExists = deployments.some(d => d.id === id);
  
  if (deploymentExists) {
    const workflowData = JSON.parse(config.data);
    
    // Create elements array from nodes array, converting them to the proper format
    const elements: WorkflowElement[] = workflowData.elements || [];
    
    // Update the workflow using string key
    workflows[id.toString()] = {
      elements: elements
    };
    
    // Save to localStorage
    saveWorkflows();
    
    return [200, { message: 'Workflow updated successfully' }];
  }
  
  return [404, { message: 'Deployment not found' }];
});
mock.onPut(/\/api\/deployments\/\d+\/workflow/).reply((config) => {
  const idMatch = /deployments\/(\d+)\/workflow/.exec(config.url || '');
  if (!idMatch) {
    return [404, { message: 'Deployment not found' }];
  }
  
  const id = parseInt(idMatch[1], 10); // Convert to number
  const deploymentExists = deployments.some(d => d.id === id);
  
  if (deploymentExists) {
    const workflowData = JSON.parse(config.data);
    
    // Create elements array from nodes array, converting them to the proper format
    const elements: WorkflowElement[] = workflowData.elements || [];
    
    // Update the workflow using string key
    workflows[id.toString()] = {
      elements: elements
    };
    
    // Save to localStorage
    saveWorkflows();
    
    return [200, { message: 'Workflow updated successfully' }];
  }
  
  return [404, { message: 'Deployment not found' }];
});

// Mock updating a deployment - support both full URL and relative path
mock.onPut(/http:\/\/localhost:5000\/api\/deployments\/\d+/).reply((config) => {
  const idStr = config.url?.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : -1; // Convert to number
  const updatedData = JSON.parse(config.data);
  
  const index = deployments.findIndex(d => d.id === id);
  if (index === -1) {
    return [404, { message: 'Deployment not found' }];
  }
  
  deployments[index] = { ...deployments[index], ...updatedData };
  saveDeployments();
  
  return [200, deployments[index]];
});
mock.onPut(/\/api\/deployments\/\d+/).reply((config) => {
  const idStr = config.url?.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : -1; // Convert to number
  const updatedData = JSON.parse(config.data);
  
  const index = deployments.findIndex(d => d.id === id);
  if (index === -1) {
    return [404, { message: 'Deployment not found' }];
  }
  
  deployments[index] = { ...deployments[index], ...updatedData };
  saveDeployments();
  
  return [200, deployments[index]];
});

// Mock deleting a deployment - support both full URL and relative path
mock.onDelete(/http:\/\/localhost:5000\/api\/deployments\/\d+/).reply((config) => {
  const idStr = config.url?.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : -1; // Convert to number
  
  const index = deployments.findIndex(d => d.id === id);
  if (index === -1) {
    return [404, { message: 'Deployment not found' }];
  }
  
  deployments.splice(index, 1);
  delete workflows[id.toString()]; // Convert to string for workflow key
  
  saveDeployments();
  saveWorkflows();
  
  return [200, { message: 'Deployment deleted successfully' }];
});
mock.onDelete(/\/api\/deployments\/\d+/).reply((config) => {
  const idStr = config.url?.split('/').pop();
  const id = idStr ? parseInt(idStr, 10) : -1; // Convert to number
  
  const index = deployments.findIndex(d => d.id === id);
  if (index === -1) {
    return [404, { message: 'Deployment not found' }];
  }
  
  deployments.splice(index, 1);
  delete workflows[id.toString()]; // Convert to string for workflow key
  
  saveDeployments();
  saveWorkflows();
  
  return [200, { message: 'Deployment deleted successfully' }];
});

// Mock API endpoints for health checks
mock.onGet('/api/health').reply(200, { status: 'ok' });
mock.onGet('http://localhost:5000/api/health').reply(200, { status: 'ok' });

export default mock; 