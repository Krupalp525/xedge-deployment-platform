import { Plugin, Workflow, Deployment } from './types';
import axios from 'axios';
import './mockApi'; // This ensures mockApi is loaded and intercepting axios requests

// Define API base URL
const API_URL = 'http://localhost:5000/api';

// Define the API mode type
export type ApiMode = 'mock' | 'real';

// Event to notify subscribers of API mode changes
const API_MODE_CHANGE_EVENT = 'apiModeChanged';

const API_MODE_STORAGE_KEY = 'xedgeApiMode';

// Check for user's mock API preference in localStorage
export const getApiMode = (): ApiMode => {
  const savedMode = localStorage.getItem(API_MODE_STORAGE_KEY);
  return (savedMode === 'real') ? 'real' : 'mock';
};

// Toggle between mock and real API modes
export const toggleApiMode = (): ApiMode => {
  const currentMode = getApiMode();
  const newMode: ApiMode = currentMode === 'real' ? 'mock' : 'real';
  localStorage.setItem(API_MODE_STORAGE_KEY, newMode);
  
  // Dispatch event to notify subscribers
  window.dispatchEvent(new CustomEvent(API_MODE_CHANGE_EVENT));
  
  return newMode;
};

// Force mock mode (used when real API is not available)
export const forceMockMode = (): void => {
  localStorage.setItem(API_MODE_STORAGE_KEY, 'mock');
  window.dispatchEvent(new CustomEvent(API_MODE_CHANGE_EVENT));
  
  // Show notification to user
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '70px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#f44336';
  notification.style.color = 'white';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  notification.style.zIndex = '10000';
  notification.style.maxWidth = '350px';
  notification.innerHTML = `
    <div style="display:flex;align-items:center">
      <div style="margin-right:12px">⚠️</div>
      <div>
        <div style="font-weight:bold;margin-bottom:4px">Authentication Error</div>
        <div>Switched to Mock API mode due to authentication issues. Please log in to use the real API.</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 6 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    setTimeout(() => document.body.removeChild(notification), 500);
  }, 6000);
};

// Check if we should use the real API
const shouldUseRealApi = (): boolean => {
  // Check if the user has explicitly set the API mode to 'real'
  return getApiMode() === 'real' && process.env.NODE_ENV !== 'test';
};

// Helper function to make real API calls with authorization
const callRealApi = async (method: string, endpoint: string, data?: any) => {
  try {
    const token = localStorage.getItem('token') || '';
    const config = {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'x-auth-token': token || '',
        'Content-Type': 'application/json'
      }
    };

    let response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await axios.get(`${API_URL}${endpoint}`, config);
        break;
      case 'post':
        response = await axios.post(`${API_URL}${endpoint}`, data, config);
        break;
      case 'put':
        response = await axios.put(`${API_URL}${endpoint}`, data, config);
        break;
      case 'delete':
        response = await axios.delete(`${API_URL}${endpoint}`, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return response.data;
    
  } catch (error: any) {
    console.error(`Error calling real API ${method} ${endpoint}:`, error);

    // Check for 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Switch to mock mode automatically
      forceMockMode();
      
      throw new Error(`Authentication error (401): You are not authorized to access the real API. Switched to mock mode.`);
    } 
    
    // Handle other HTTP errors
    if (error.response) {
      const statusText = error.response.statusText || 'Unknown error';
      const status = error.response.status || '???';
      throw new Error(`Error ${status} - ${statusText}\n\n${error.response.data?.message || 'Please check your connection and try again.'}`);
    } 
    
    // Handle network errors
    if (error.request) {
      // The request was made but no response was received
      forceMockMode();
      throw new Error(`Network error: The server is not responding. Switched to mock mode.`);
    }
    
    // For any other error
    throw error;
  }
};

// Sample plugins data
const plugins: Plugin[] = [
  {
    id: "plugin-input-file",
    name: "File Input",
    category: "Input",
    description: "Read data from a file",
    type: "source",
    settings: {
      basic: [
        { key: "filePath", type: "string", label: "File Path" }
      ]
    }
  },
  {
    id: "plugin-input-api",
    name: "API Input",
    category: "Input",
    description: "Fetch data from an API",
    type: "source",
    settings: {
      basic: [
        { key: "apiUrl", type: "string", label: "API URL" },
        { key: "interval", type: "number", label: "Polling Interval (ms)" }
      ]
    }
  },
  {
    id: "plugin-filter-basic",
    name: "Basic Filter",
    category: "Processing",
    description: "Filter data based on conditions",
    type: "filter",
    settings: {
      basic: [
        { key: "condition", type: "string", label: "Filter Condition" }
      ]
    }
  },
  {
    id: "plugin-transform-json",
    name: "JSON Transform",
    category: "Processing",
    description: "Transform data format",
    type: "transform",
    settings: {
      basic: [
        { key: "template", type: "text", label: "JSON Template" }
      ]
    }
  },
  {
    id: "plugin-process-ai",
    name: "AI Processor",
    category: "Advanced",
    description: "Process data using AI models",
    type: "process",
    settings: {
      basic: [
        { key: "modelId", type: "string", label: "Model ID" },
        { key: "batchSize", type: "number", label: "Batch Size" }
      ]
    }
  },
  {
    id: "plugin-output-database",
    name: "Database Output",
    category: "Output",
    description: "Store data in a database",
    type: "sink",
    settings: {
      basic: [
        { key: "connectionString", type: "string", label: "Connection String" },
        { key: "tableName", type: "string", label: "Table Name" }
      ]
    }
  },
  {
    id: "plugin-output-file",
    name: "File Output",
    category: "Output",
    description: "Write data to a file",
    type: "sink",
    settings: {
      basic: [
        { key: "outputPath", type: "string", label: "Output File Path" }
      ]
    }
  }
];

// Sample initial deployments data
const initialDeployments: Deployment[] = [
  { 
    id: 1, 
    name: 'Production Deployment', 
    host: 'localhost', 
    port: '8001', 
    user_id: 1, 
    created_at: '2023-05-01T10:00:00Z', 
    updated_at: '2023-05-01T10:00:00Z', 
    owner_username: 'admin' 
  },
  { 
    id: 2, 
    name: 'Test Deployment', 
    host: 'localhost', 
    port: '8002', 
    user_id: 1, 
    created_at: '2023-05-02T11:30:00Z', 
    updated_at: '2023-05-02T11:30:00Z', 
    owner_username: 'admin' 
  },
  { 
    id: 3, 
    name: 'Development Deployment', 
    host: 'localhost', 
    port: '8003', 
    user_id: 1, 
    created_at: '2023-05-03T09:15:00Z', 
    updated_at: '2023-05-03T09:15:00Z', 
    owner_username: 'admin' 
  }
];

// Sample initial workflows for each deployment
const initialWorkflows: Record<string, Workflow> = {
  '1': {
    elements: [
      {
        id: 'node_1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'File Input', pluginId: 'plugin-input-file', config: { filePath: '/data/input.csv' } }
      },
      {
        id: 'node_2',
        type: 'default',
        position: { x: 400, y: 100 },
        data: { label: 'Basic Filter', pluginId: 'plugin-filter-basic', config: { condition: 'value > 10' } }
      },
      {
        id: 'node_3',
        type: 'default',
        position: { x: 700, y: 100 },
        data: { label: 'Database Output', pluginId: 'plugin-output-database', config: { connectionString: 'mysql://user:pass@localhost/db', tableName: 'processed_data' } }
      }
    ]
  },
  '2': {
    elements: [
      {
        id: 'node_1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'API Input', pluginId: 'plugin-input-api', config: { apiUrl: 'https://api.example.com/data', interval: 5000 } }
      },
      {
        id: 'node_2',
        type: 'default',
        position: { x: 400, y: 100 },
        data: { label: 'JSON Transform', pluginId: 'plugin-transform-json', config: { template: '{"result": ${value}}' } }
      }
    ]
  },
  '3': {
    elements: []
  }
};

// Helper function to get deployments from localStorage or use the initial deployments
function getStoredDeployments(): Deployment[] {
  try {
    const storedDeployments = localStorage.getItem('mockDeployments');
    if (storedDeployments) {
      return JSON.parse(storedDeployments);
    }
  } catch (error) {
    console.error('Error reading deployments from localStorage:', error);
  }
  
  // If nothing in localStorage, save the initial deployments and return them
  localStorage.setItem('mockDeployments', JSON.stringify(initialDeployments));
  return initialDeployments;
}

// Helper function to get workflows from localStorage or use the initial workflows
function getStoredWorkflows(): Record<string, Workflow> {
  try {
    const storedWorkflows = localStorage.getItem('mockWorkflows');
    if (storedWorkflows) {
      return JSON.parse(storedWorkflows);
    }
  } catch (error) {
    console.error('Error reading workflows from localStorage:', error);
  }
  
  // If nothing in localStorage, save the initial workflows and return them
  localStorage.setItem('mockWorkflows', JSON.stringify(initialWorkflows));
  return initialWorkflows;
}

// Initialize our data from localStorage or defaults
let deployments = getStoredDeployments();
let workflows = getStoredWorkflows();

// Save deployments to localStorage whenever they change
function saveDeployments() {
  localStorage.setItem('mockDeployments', JSON.stringify(deployments));
}

// Save workflows to localStorage whenever they change
function saveWorkflows() {
  localStorage.setItem('mockWorkflows', JSON.stringify(workflows));
}

// Create the API service for auth
export const authApi = {
  login: async (username: string, password: string) => {
    if (shouldUseRealApi()) {
      try {
        return await callRealApi('post', '/auth/login', { username, password });
      } catch (error) {
        // For login specifically, we want to propagate the error
        // and not automatically fall back to mock, as the user should
        // know their login failed
        throw error;
      }
    }
    
    // Mock implementation
    console.log('Mock login', username, password);
    
    return {
      token: 'mock-jwt-token',
      user: { id: 1, username: 'admin' }
    };
  },
  
  register: async (username: string, password: string, email: string) => {
    if (shouldUseRealApi()) {
      return await callRealApi('post', '/auth/register', { username, password, email });
    }
    
    // Mock implementation
    console.log('Mock register', username, password, email);
    
    return {
      token: 'mock-jwt-token',
      user: { id: 1, username, email }
    };
  }
};

// Create the API service for deployments
export const deploymentsApi = {
  // Get all deployments
  getAll: async () => {
    if (shouldUseRealApi()) {
      return await callRealApi('get', '/deployments');
    }
    
    // Mock implementation
    console.log('Mock getAll deployments');
    try {
      const response = await axios.get('/api/deployments');
      return response.data;
    } catch (error) {
      console.error('Error fetching deployments:', error);
      return [];
    }
  },
  
  // Get a deployment by ID
  getById: async (id: number) => {
    if (shouldUseRealApi()) {
      return await callRealApi('get', `/deployments/${id}`);
    }
    
    // Mock implementation
    console.log('Mock getById deployment', id);
    try {
      const response = await axios.get(`/api/deployments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching deployment ${id}:`, error);
      throw new Error('Deployment not found');
    }
  },
  
  // Create a new deployment
  create: async (deployment: Partial<Deployment>) => {
    if (shouldUseRealApi()) {
      return await callRealApi('post', '/deployments', deployment);
    }
    
    // Mock implementation
    console.log('Mock create deployment', deployment);
    try {
      const response = await axios.post('/api/deployments', deployment);
      return response.data;
    } catch (error) {
      console.error('Error creating deployment:', error);
      throw new Error('Failed to create deployment');
    }
  },
  
  // Update a deployment
  update: async (id: number, deployment: Partial<Deployment>) => {
    if (shouldUseRealApi()) {
      return await callRealApi('put', `/deployments/${id}`, deployment);
    }
    
    // Mock implementation
    console.log('Mock update deployment', id, deployment);
    try {
      const response = await axios.put(`/api/deployments/${id}`, deployment);
      return response.data;
    } catch (error) {
      console.error(`Error updating deployment ${id}:`, error);
      throw new Error('Deployment not found');
    }
  },
  
  // Delete a deployment
  delete: async (id: number) => {
    if (shouldUseRealApi()) {
      return await callRealApi('delete', `/deployments/${id}`);
    }
    
    // Mock implementation
    console.log('Mock delete deployment', id);
    try {
      await axios.delete(`/api/deployments/${id}`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting deployment ${id}:`, error);
      throw new Error('Deployment not found');
    }
  }
};

// Create the API service for plugins
export const pluginsApi = {
  // Get all plugins
  getAll: async () => {
    if (shouldUseRealApi()) {
      return await callRealApi('get', '/plugins');
    }
    
    // Mock implementation
    console.log('Mock getAll plugins');
    try {
      const response = await axios.get('/api/plugins');
      return response.data;
    } catch (error) {
      console.error('Error fetching plugins:', error);
      return [];
    }
  }
};

// Create the API service for workflows
export const workflowsApi = {
  // Get a workflow by deployment ID
  getByDeploymentId: async (deploymentId: number) => {
    if (shouldUseRealApi()) {
      return await callRealApi('get', `/deployments/${deploymentId}/workflow`);
    }
    
    // Mock implementation
    console.log('Mock getByDeploymentId workflow', deploymentId);
    try {
      const response = await axios.get(`/api/deployments/${deploymentId}/workflow`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workflow for deployment ${deploymentId}:`, error);
      return { elements: [] };
    }
  },
  
  // Update a workflow
  update: async (deploymentId: number, workflow: Workflow) => {
    if (shouldUseRealApi()) {
      return await callRealApi('put', `/deployments/${deploymentId}/workflow`, workflow);
    }
    
    // Mock implementation
    console.log('Mock update workflow', deploymentId, workflow);
    try {
      const response = await axios.put(`/api/deployments/${deploymentId}/workflow`, workflow);
      return response.data;
    } catch (error) {
      console.error(`Error updating workflow for deployment ${deploymentId}:`, error);
      throw new Error('Failed to update workflow');
    }
  }
};

// Export the entire API service
export default {
  auth: authApi,
  deployments: deploymentsApi,
  plugins: pluginsApi,
  workflows: workflowsApi,
  // Export utility functions for the toggle
  getApiMode,
  toggleApiMode,
  forceMockMode
}; 