// Re-export all API types from the api.ts file
export * from './types/api';

// Plugin types
export interface PluginSetting {
  key: string;
  type: string;
  label: string;
}

export interface Plugin {
  id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  settings?: {
    basic: PluginSetting[];
  };
}

// Workflow types
export interface WorkflowElement {
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

export interface Workflow {
  elements: WorkflowElement[];
}

// Deployment types
export interface Deployment {
  id: number;
  name: string;
  host: string;
  port: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  owner_username: string;
  connectionStatus?: 'connected' | 'disconnected' | 'unknown';
}

// Helper type for creating new deployments
export type DeploymentCreate = Pick<Deployment, 'name' | 'host' | 'port'>;

// Helper type for updating existing deployments
export type DeploymentUpdate = Partial<Deployment> & { id: number };

// User types
export interface User {
  id: number | string;
  username: string;
  email?: string;
}

// Authentication types
export interface AuthResponse {
  token: string;
  user: User;
}

// API Response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 