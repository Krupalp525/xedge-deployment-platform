import { Deployment } from '../types';

// Sample initial deployments data to match backend structure
export const mockDeployments: Deployment[] = [
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