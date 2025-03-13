import { Workflow } from '../types';

// Sample initial workflows for each deployment
export const mockWorkflows: Record<string, Workflow> = {
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