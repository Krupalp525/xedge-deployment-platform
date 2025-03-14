// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generic paginated response type
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Generic error response
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Authentication response
export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email?: string;
  };
}

// HTTP methods type
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API Request options
export interface ApiRequestOptions {
  method: HttpMethod;
  endpoint: string;
  data?: any;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

// Connection status response
export interface ConnectionStatusResponse {
  connectionStatus: 'connected' | 'disconnected';
  message?: string;
  details?: Record<string, any>;
} 