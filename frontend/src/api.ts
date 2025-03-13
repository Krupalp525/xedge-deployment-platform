import { Plugin, Workflow, Deployment, ApiResponse, AuthResponse } from './types';
import axios from 'axios';
import './mockApi'; // This ensures mockApi is loaded and intercepting axios requests

// Import mock data
import { mockPlugins } from './mock-data/plugins';
import { mockDeployments } from './mock-data/deployments';
import { mockWorkflows } from './mock-data/workflows';

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
  localStorage.setItem('mockDeployments', JSON.stringify(mockDeployments));
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
    console.error('Error reading workflows from localStorage:', error);
  }
  
  // If nothing in localStorage, save the initial workflows and return them
  localStorage.setItem('mockWorkflows', JSON.stringify(mockWorkflows));
  return mockWorkflows;
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
  login: async (username: string, password: string): Promise<AuthResponse> => {
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
    // console.log('Mock login', username, password);
    
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
    // console.log('Mock register', username, password, email);
    
    return {
      token: 'mock-jwt-token',
      user: { id: 1, username, email }
    };
  }
};

// Create the API service for deployments
export const deploymentsApi = {
  // Get all deployments
  getAll: async (): Promise<ApiResponse<Deployment[]>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('get', '/deployments');
    }
    
    // Mock implementation
    // console.log('Mock getAll deployments');
    
    return {
      success: true,
      data: getStoredDeployments()
    };
  },
  
  // Get a deployment by ID
  getById: async (id: number): Promise<ApiResponse<Deployment>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('get', `/deployments/${id}`);
    }
    
    // Mock implementation
    // console.log('Mock getById deployment', id);
    
    const deployment = getStoredDeployments().find(d => d.id === id);
    
    if (!deployment) {
      return { 
        success: false, 
        error: `Deployment with ID ${id} not found`
      };
    }
    
    return {
      success: true,
      data: deployment
    };
  },
  
  // Create a new deployment
  create: async (deployment: Omit<Deployment, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'owner_username'>): Promise<ApiResponse<Deployment>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('post', '/deployments', deployment);
    }
    
    // Mock implementation
    // console.log('Mock create deployment', deployment);
    
    try {
      const deployments = getStoredDeployments();
      const newId = Math.max(...deployments.map(d => d.id), 0) + 1;
      const now = new Date().toISOString();
      
      const newDeployment: Deployment = {
        id: newId,
        name: deployment.name,
        host: deployment.host,
        port: deployment.port,
        user_id: 1, // Mock user ID
        created_at: now,
        updated_at: now,
        owner_username: 'admin' // Mock username
      };
      
      // Add to local storage
      deployments.push(newDeployment);
      saveDeployments();
      
      // Create an empty workflow for this deployment
      const workflowsMap = getStoredWorkflows();
      workflowsMap[newId.toString()] = { elements: [] };
      saveWorkflows();
      
      return {
        success: true,
        data: newDeployment
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create deployment'
      };
    }
  },
  
  // Update a deployment
  update: async (id: number, deployment: Partial<Deployment>): Promise<ApiResponse<Deployment>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('put', `/deployments/${id}`, deployment);
    }
    
    // Mock implementation
    // console.log('Mock update deployment', id, deployment);
    
    try {
      const deployments = getStoredDeployments();
      const index = deployments.findIndex(d => d.id === id);
      
      if (index === -1) {
        return {
          success: false,
          error: `Deployment with ID ${id} not found`
        };
      }
      
      deployments[index] = {
        ...deployments[index],
        ...deployment,
        updated_at: new Date().toISOString()
      };
      
      saveDeployments();
      
      return {
        success: true,
        data: deployments[index]
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update deployment'
      };
    }
  },
  
  // Delete a deployment
  delete: async (id: number): Promise<ApiResponse<{ id: number }>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('delete', `/deployments/${id}`);
    }
    
    // Mock implementation
    // console.log('Mock delete deployment', id);
    
    try {
      const deployments = getStoredDeployments();
      const index = deployments.findIndex(d => d.id === id);
      
      if (index === -1) {
        return {
          success: false,
          error: `Deployment with ID ${id} not found`
        };
      }
      
      deployments.splice(index, 1);
      saveDeployments();
      
      // Also delete the associated workflow
      const workflowsMap = getStoredWorkflows();
      delete workflowsMap[id.toString()];
      saveWorkflows();
      
      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete deployment'
      };
    }
  }
};

// Create the API service for plugins
export const pluginsApi = {
  // Get all plugins
  getAll: async (): Promise<ApiResponse<Plugin[]>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('get', '/plugins');
    }
    
    // Mock implementation
    // console.log('Mock getAll plugins');
    
    return {
      success: true,
      data: mockPlugins
    };
  }
};

// Create the API service for workflows
export const workflowsApi = {
  // Get a workflow by deployment ID
  getByDeploymentId: async (deploymentId: number): Promise<ApiResponse<Workflow>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('get', `/deployments/${deploymentId}/workflow`);
    }
    
    // Mock implementation
    // console.log('Mock getByDeploymentId workflow', deploymentId);
    
    const workflowsMap = getStoredWorkflows();
    const workflowId = deploymentId.toString();
    
    if (!workflowsMap[workflowId]) {
      workflowsMap[workflowId] = { elements: [] };
      saveWorkflows();
    }
    
    return {
      success: true,
      data: workflowsMap[workflowId]
    };
  },
  
  // Update a workflow
  update: async (deploymentId: number, workflow: Workflow): Promise<ApiResponse<Workflow>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('put', `/deployments/${deploymentId}/workflow`, workflow);
    }
    
    // Mock implementation
    // console.log('Mock update workflow', deploymentId, workflow);
    
    try {
      const workflowsMap = getStoredWorkflows();
      const workflowId = deploymentId.toString();
      
      workflowsMap[workflowId] = workflow;
      saveWorkflows();
      
      return {
        success: true,
        data: workflow
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update workflow'
      };
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