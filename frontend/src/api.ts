import { Plugin, Workflow, Deployment, DeploymentCreate, DeploymentUpdate, ApiResponse, AuthResponse } from './types';
import axios from 'axios';
import './mockApi'; // This ensures mockApi is loaded and intercepting axios requests

// Import mock data
import { mockPlugins } from './mock-data/plugins';
import { mockDeployments } from './mock-data/deployments';
import { mockWorkflows } from './mock-data/workflows';

// Define API base URL
const API_URL = 'http://localhost:5000/api';

// Connection status cache with expiration time (5 minutes)
const connectionStatusCache: {
  [key: string]: {
    status: 'connected' | 'disconnected',
    timestamp: number
  }
} = {};

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

    // Check if this is an auth endpoint (login or register)
    // Auth endpoints expect a direct return of AuthResponse
    if (endpoint.startsWith('/auth/')) {
      return response.data;
    }

    // For other endpoints, wrap the response data in the expected format with success and data properties
    return {
      success: true,
      data: response.data
    };
    
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
    
    if (deployment) {
      return {
        success: true,
        data: deployment
      };
    } else {
      return {
        success: false,
        error: `Deployment with ID ${id} not found`
      };
    }
  },
  
  // Create a new deployment
  create: async (deployment: DeploymentCreate): Promise<ApiResponse<Deployment>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('post', '/deployments', deployment);
    }
    
    // Mock implementation
    // console.log('Mock create deployment', deployment);
    
    // Generate an ID for the new deployment if it doesn't have one
    const newDeployment: Deployment = {
      ...deployment as any, // Cast to any to avoid TypeScript errors
      id: Math.max(0, ...deployments.map(d => d.id || 0)) + 1,
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_username: 'admin'
    };
    
    // Add to our "database"
    deployments.push(newDeployment);
    saveDeployments();
    
    return {
      success: true,
      data: newDeployment
    };
  },
  
  // Update a deployment
  update: async (id: number, deployment: DeploymentUpdate): Promise<ApiResponse<Deployment>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('put', `/deployments/${id}`, deployment);
    }
    
    // Mock implementation
    // console.log('Mock update deployment', id, deployment);
    
    // Find the deployment to update
    const index = deployments.findIndex(d => d.id === id);
    
    if (index === -1) {
      return {
        success: false,
        error: `Deployment with ID ${id} not found`
      };
    }
    
    // Update the deployment
    const updatedDeployment: Deployment = {
      ...deployments[index],
      ...deployment,
      updated_at: new Date().toISOString()
    };
    
    deployments[index] = updatedDeployment;
    saveDeployments();
    
    return {
      success: true,
      data: updatedDeployment
    };
  },
  
  // Delete a deployment
  delete: async (id: number): Promise<ApiResponse<boolean>> => {
    if (shouldUseRealApi()) {
      return await callRealApi('delete', `/deployments/${id}`);
    }
    
    // Mock implementation
    // console.log('Mock delete deployment', id);
    
    // Find the deployment to delete
    const index = deployments.findIndex(d => d.id === id);
    
    if (index === -1) {
      return {
        success: false,
        error: `Deployment with ID ${id} not found`
      };
    }
    
    // Remove the deployment
    deployments.splice(index, 1);
    saveDeployments();
    
    return {
      success: true,
      data: true
    };
  },
  
  // Check connection to a Fledge server
  checkConnection: async (deployment: Deployment): Promise<ApiResponse<Deployment>> => {
    if (!shouldUseRealApi()) {
      // Mock implementation - randomly return connected or disconnected
      const mockStatus = Math.random() > 0.3 ? 'connected' : 'disconnected' as 'connected' | 'disconnected';
      const updatedDeployment = {
        ...deployment,
        connectionStatus: mockStatus
      };
      
      return {
        success: true,
        data: updatedDeployment
      };
    }
    
    try {
      // Check if we have a cached status that's less than 5 minutes old
      const cacheKey = `${deployment.host}:${deployment.port}`;
      const cachedStatus = connectionStatusCache[cacheKey];
      const now = Date.now();
      const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (cachedStatus && (now - cachedStatus.timestamp < CACHE_EXPIRATION)) {
        console.log(`Using cached connection status for ${cacheKey}: ${cachedStatus.status}`);
        return {
          success: true,
          data: {
            ...deployment,
            connectionStatus: cachedStatus.status
          }
        };
      }
      
      // Validate port before trying to construct URL
      const port = parseInt(deployment.port, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`Invalid port number: ${deployment.port}`);
        
        // Return disconnected status for invalid port
        const updatedDeployment = {
          ...deployment,
          connectionStatus: 'disconnected' as 'disconnected'
        };
        
        // Cache the status
        connectionStatusCache[cacheKey] = {
          status: 'disconnected',
          timestamp: now
        };
        
        return {
          success: true,
          data: updatedDeployment
        };
      }
      
      // Try multiple possible endpoints for Fledge server ping
      const baseUrl = `http://${deployment.host}:${port}`;
      const possibleEndpoints = [
        '/fledge/ping',    // Standard endpoint from documentation
        '/ping',           // Simplified endpoint
        '/api/fledge/ping' // API prefixed endpoint
      ];
      
      let connected = false;
      let responseData = null;
      
      // Reduce timeout to improve performance
      const TIMEOUT = 3000; // 3 seconds instead of 5
      
      // Try each endpoint until we get a successful response
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying to connect to Fledge server at ${baseUrl}${endpoint}`);
          // Use axios directly here instead of callRealApi, since we're connecting to the Fledge server, not our API
          const response = await axios.get(`${baseUrl}${endpoint}`, { 
            timeout: TIMEOUT,
            validateStatus: (status) => status < 500 // Accept any status code less than 500
          });
          
          // If we get any response (even 404), the server is at least running
          // But only consider it fully connected if we get a 200 OK with data
          if (response.status === 200 && response.data) {
            connected = true;
            responseData = response.data;
            console.log(`Successfully connected to Fledge server at ${baseUrl}${endpoint}`, responseData);
            break;
          }
        } catch (endpointError: any) {
          // Just log and continue to next endpoint
          console.log(`Failed to connect to ${baseUrl}${endpoint}:`, endpointError.message);
        }
      }
      
      // If we got at least some response, consider server up but endpoint may be wrong
      const serverUp = connected || responseData !== null;
      
      // Update the deployment with the connection status
      const connectionStatus = connected ? 'connected' as 'connected' : 'disconnected' as 'disconnected';
      const updatedDeployment = {
        ...deployment,
        connectionStatus
      };
      
      // Cache the status
      connectionStatusCache[cacheKey] = {
        status: connectionStatus,
        timestamp: now
      };
      
      if (!connected) {
        console.log(`Cannot fully connect to Fledge server at ${deployment.host}:${deployment.port}, server is ${serverUp ? 'up but no valid endpoint' : 'down'}`);
      }
      
      return {
        success: true,
        data: updatedDeployment
      };
    } catch (error) {
      console.error(`Error connecting to Fledge server at ${deployment.host}:${deployment.port}:`, error);
      
      // If there's an error, mark as disconnected
      const updatedDeployment = {
        ...deployment,
        connectionStatus: 'disconnected' as 'disconnected'
      };
      
      // Cache the error status
      const cacheKey = `${deployment.host}:${deployment.port}`;
      connectionStatusCache[cacheKey] = {
        status: 'disconnected',
        timestamp: Date.now()
      };
      
      return {
        success: true,
        data: updatedDeployment
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
  },
  
  // Get plugins from a specific Fledge deployment
  getFledgePlugins: async (deployment: Deployment): Promise<ApiResponse<Plugin[]>> => {
    if (!shouldUseRealApi()) {
      // Mock implementation
      return {
        success: true,
        data: mockPlugins
      };
    }
    
    try {
      // Check if the deployment is connected before attempting to fetch plugins
      const connectionResponse = await deploymentsApi.checkConnection(deployment);
      if (!connectionResponse.success || connectionResponse.data?.connectionStatus !== 'connected') {
        return {
          success: false,
          error: `Cannot fetch plugins: Fledge server at ${deployment.host}:${deployment.port} is not connected`
        };
      }
      
      // The port from the deployment object
      const port = parseInt(deployment.port, 10);
      
      // Try multiple possible endpoints for Fledge server plugin API
      const baseUrl = `http://${deployment.host}:${port}`;
      const possibleEndpoints = [
        '/fledge/plugin',         // Standard endpoint from documentation
        '/plugin',                // Simplified endpoint
        '/api/fledge/plugin',     // API prefixed endpoint
        '/fledge/plugins',        // Plural endpoint
        '/plugins',               // Simplified plural endpoint
        '/api/fledge/plugins'     // API prefixed plural endpoint
      ];
      
      // Timeout for the request
      const TIMEOUT = 5000;
      let plugins: Plugin[] = [];
      let endpointFound = false;
      
      // Try each endpoint until we get a successful response
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying to fetch plugins from Fledge server at ${baseUrl}${endpoint}`);
          
          // Use axios directly here instead of callRealApi
          const response = await axios.get(`${baseUrl}${endpoint}`, { 
            timeout: TIMEOUT,
            validateStatus: (status) => status < 500 // Accept any status code less than 500
          });
          
          // If we get a successful response, process the data
          if (response.status === 200 && response.data) {
            console.log(`Successfully fetched plugins from Fledge server at ${baseUrl}${endpoint}`, response.data);
            
            // Process the response data based on the format
            if (Array.isArray(response.data)) {
              // If it's already an array of plugins
              plugins = response.data;
            } else if (response.data.plugins && Array.isArray(response.data.plugins)) {
              // If plugins are in a 'plugins' property
              plugins = response.data.plugins;
            } else {
              // Try to extract plugins from the response
              const extractedPlugins = [];
              for (const key in response.data) {
                if (typeof response.data[key] === 'object') {
                  extractedPlugins.push({
                    id: key,
                    name: response.data[key].name || key,
                    description: response.data[key].description || '',
                    type: response.data[key].type || 'unknown',
                    category: response.data[key].category || 'Fledge Plugin'
                  });
                }
              }
              plugins = extractedPlugins;
            }
            
            endpointFound = true;
            break;
          }
        } catch (endpointError: any) {
          // Just log and continue to next endpoint
          console.log(`Failed to fetch plugins from ${baseUrl}${endpoint}:`, endpointError.message);
        }
      }
      
      if (!endpointFound || plugins.length === 0) {
        console.error(`Could not find a valid plugin endpoint for Fledge server at ${deployment.host}:${deployment.port}`);
        return {
          success: false,
          error: `Could not find plugins on the Fledge server. Server may be up but plugins API endpoint not found.`
        };
      }
      
      return {
        success: true,
        data: plugins
      };
    } catch (error: any) {
      console.error(`Error fetching plugins from Fledge server at ${deployment.host}:${deployment.port}:`, error);
      
      return {
        success: false,
        error: `Failed to fetch plugins: ${error.message}`
      };
    }
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
  
  // Get a workflow configuration from Fledge server
  getFledgeWorkflow: async (deployment: Deployment): Promise<ApiResponse<Workflow>> => {
    if (!shouldUseRealApi()) {
      // Mock implementation - use the stored workflow
      const workflowsMap = getStoredWorkflows();
      const workflowId = deployment.id?.toString() || '0';
      
      return {
        success: true,
        data: workflowsMap[workflowId] || { elements: [] }
      };
    }
    
    try {
      // Check if the deployment is connected before attempting to fetch workflow
      const connectionResponse = await deploymentsApi.checkConnection(deployment);
      if (!connectionResponse.success || connectionResponse.data?.connectionStatus !== 'connected') {
        return {
          success: false,
          error: `Cannot fetch workflow: Fledge server at ${deployment.host}:${deployment.port} is not connected`
        };
      }
      
      // The port from the deployment object
      const port = parseInt(deployment.port, 10);
      
      // Try multiple possible endpoints for Fledge server plugin API
      const baseUrl = `http://${deployment.host}:${port}`;
      const possibleEndpoints = [
        '/fledge/workflow',        // Standard endpoint from documentation
        '/workflow',               // Simplified endpoint
        '/api/fledge/workflow',    // API prefixed endpoint
        '/fledge/pipeline',        // Alternative naming
        '/pipeline',               // Simplified alternative naming
        '/api/fledge/pipeline'     // API prefixed alternative naming
      ];
      
      // Timeout for the request
      const TIMEOUT = 5000;
      let workflowData = null;
      let endpointFound = false;
      
      // Try each endpoint until we get a successful response
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying to fetch workflow from Fledge server at ${baseUrl}${endpoint}`);
          
          // Use axios directly here instead of callRealApi
          const response = await axios.get(`${baseUrl}${endpoint}`, { 
            timeout: TIMEOUT,
            validateStatus: (status) => status < 500 // Accept any status code less than 500
          });
          
          // If we get a successful response, process the data
          if (response.status === 200 && response.data) {
            console.log(`Successfully fetched workflow from Fledge server at ${baseUrl}${endpoint}`, response.data);
            
            // Process the response data based on the format
            if (response.data.elements) {
              // If it has elements array in our expected format
              workflowData = response.data;
            } else if (response.data.nodes && response.data.edges) {
              // If it has nodes and edges separately
              workflowData = {
                elements: [
                  ...response.data.nodes.map((node: any) => ({
                    id: node.id,
                    type: node.type || 'default',
                    position: node.position,
                    data: node.data
                  })),
                  ...response.data.edges.map((edge: any) => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    type: 'edge'
                  }))
                ]
              };
            } else if (Array.isArray(response.data)) {
              // If it's an array of pipeline elements
              workflowData = {
                elements: response.data.map((item: any, index: number) => {
                  // Create a node for each element in the array
                  return {
                    id: item.id || `node-${index}`,
                    type: 'custom',
                    position: { x: 100 + (index * 200), y: 100 },
                    data: {
                      label: item.name || `Node ${index}`,
                      pluginId: item.plugin_id || item.id || `plugin-${index}`,
                      config: item.config || {}
                    }
                  };
                })
              };
            } else {
              // Try to extract workflow from the response
              const extractedElements = [];
              let index = 0;
              for (const key in response.data) {
                if (typeof response.data[key] === 'object') {
                  extractedElements.push({
                    id: key,
                    type: 'custom',
                    position: { x: 100 + (index * 200), y: 100 },
                    data: {
                      label: response.data[key].name || key,
                      pluginId: response.data[key].plugin_id || key,
                      config: response.data[key].config || {}
                    }
                  });
                  index++;
                }
              }
              
              workflowData = { elements: extractedElements };
            }
            
            endpointFound = true;
            break;
          }
        } catch (endpointError: any) {
          // Just log and continue to next endpoint
          console.log(`Failed to fetch workflow from ${baseUrl}${endpoint}:`, endpointError.message);
        }
      }
      
      if (!endpointFound || !workflowData) {
        console.error(`Could not find a valid workflow endpoint for Fledge server at ${deployment.host}:${deployment.port}`);
        return {
          success: false,
          error: `Could not find workflow on the Fledge server. Server may be up but workflow API endpoint not found.`
        };
      }
      
      return {
        success: true,
        data: workflowData
      };
    } catch (error: any) {
      console.error(`Error fetching workflow from Fledge server at ${deployment.host}:${deployment.port}:`, error);
      
      return {
        success: false,
        error: `Failed to fetch workflow: ${error.message}`
      };
    }
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
  },
  
  // Update workflow directly on the Fledge server
  updateFledgeWorkflow: async (deployment: Deployment, workflow: Workflow): Promise<ApiResponse<Workflow>> => {
    if (!shouldUseRealApi()) {
      // Mock implementation
      const workflowsMap = getStoredWorkflows();
      const workflowId = deployment.id?.toString() || '0';
      
      workflowsMap[workflowId] = workflow;
      saveWorkflows();
      
      return {
        success: true,
        data: workflow
      };
    }
    
    try {
      // Check if the deployment is connected before attempting to update workflow
      const connectionResponse = await deploymentsApi.checkConnection(deployment);
      if (!connectionResponse.success || connectionResponse.data?.connectionStatus !== 'connected') {
        return {
          success: false,
          error: `Cannot update workflow: Fledge server at ${deployment.host}:${deployment.port} is not connected`
        };
      }
      
      // The port from the deployment object
      const port = parseInt(deployment.port, 10);
      
      // Try multiple possible endpoints for Fledge server plugin API
      const baseUrl = `http://${deployment.host}:${port}`;
      const possibleEndpoints = [
        '/fledge/workflow',        // Standard endpoint from documentation
        '/workflow',               // Simplified endpoint
        '/api/fledge/workflow',    // API prefixed endpoint
        '/fledge/pipeline',        // Alternative naming
        '/pipeline',               // Simplified alternative naming
        '/api/fledge/pipeline'     // API prefixed alternative naming
      ];
      
      // Timeout for the request
      const TIMEOUT = 5000;
      let endpointFound = false;
      
      // Format workflow for Fledge server
      // Fledge might expect a different format, so we need to prepare the data
      const fledgeWorkflowData = {
        elements: workflow.elements.map(el => {
          // If it's an edge, keep it as is
          if (el.type === 'edge') {
            return el;
          }
          
          // For nodes, extract the plugin ID and config
          return {
            id: el.id,
            type: el.type || 'custom',
            position: el.position,
            data: {
              pluginId: el.data?.pluginId,
              label: el.data?.label,
              config: el.data?.config || {}
            }
          };
        })
      };
      
      // Try each endpoint until we get a successful response
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying to update workflow on Fledge server at ${baseUrl}${endpoint}`, fledgeWorkflowData);
          
          // Use axios directly here instead of callRealApi
          const response = await axios.put(`${baseUrl}${endpoint}`, fledgeWorkflowData, { 
            timeout: TIMEOUT,
            validateStatus: (status) => status < 500 // Accept any status code less than 500
          });
          
          // If we get a successful response
          if (response.status >= 200 && response.status < 300) {
            console.log(`Successfully updated workflow on Fledge server at ${baseUrl}${endpoint}`);
            endpointFound = true;
            break;
          }
        } catch (endpointError: any) {
          // Just log and continue to next endpoint
          console.log(`Failed to update workflow at ${baseUrl}${endpoint}:`, endpointError.message);
        }
      }
      
      if (!endpointFound) {
        console.error(`Could not find a valid workflow endpoint for Fledge server at ${deployment.host}:${deployment.port}`);
        return {
          success: false,
          error: `Could not update workflow on the Fledge server. Server may be up but workflow API endpoint not found.`
        };
      }
      
      // Assuming we successfully updated the workflow on Fledge,
      // also save it to our API for consistency
      try {
        if (deployment.id) {
          await callRealApi('put', `/deployments/${deployment.id}/workflow`, workflow);
        }
      } catch (apiError) {
        console.warn('Could not save workflow to our API after updating in Fledge:', apiError);
        // Continue anyway since we already updated on Fledge
      }
      
      return {
        success: true,
        data: workflow
      };
    } catch (error: any) {
      console.error(`Error updating workflow on Fledge server at ${deployment.host}:${deployment.port}:`, error);
      
      return {
        success: false,
        error: `Failed to update workflow: ${error.message}`
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