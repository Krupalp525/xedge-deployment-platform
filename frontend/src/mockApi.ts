import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Create a new instance of axios-mock-adapter with networkTimeout and passThrough options
// Set onNoMatch to 'passthrough' to let non-mocked requests through
const mock = new MockAdapter(axios, { 
  delayResponse: 500,
  onNoMatch: 'passthrough'
});

// Add a console message to indicate that mock is configured
console.log('Mock API enabled in development mode');
console.log('All API requests will be intercepted by mock API');

// Define types for our data structures
interface PluginSetting {
  key: string;
  type: string;
  label: string;
}

interface Plugin {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  settings: {
    basic: PluginSetting[];
  };
}

interface WorkflowElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    pluginId: string;
    config: Record<string, any>;
  };
}

interface Workflow {
  elements: WorkflowElement[];
}

// Match the actual backend deployment structure
interface Deployment {
  id: number;
  name: string;
  host: string;
  port: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  owner_username: string;
}

// Sample plugins data with the expected format
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

// Sample initial deployments data to match backend structure
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
mock.onGet('http://localhost:5000/api/plugins').reply(200, plugins);
mock.onGet('/api/plugins').reply(200, plugins);

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