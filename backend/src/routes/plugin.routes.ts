import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET all plugins - protected with JWT authentication
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // In a real implementation, this would fetch plugins from a database
    // For now, we'll return a static list of plugins
    const plugins = [
      { 
        id: 'plugin-input-http', 
        name: 'HTTP Request',
        description: 'Make HTTP requests to external APIs',
        type: 'input',
        category: 'data'
      },
      { 
        id: 'plugin-processor-transform', 
        name: 'Data Transform',
        description: 'Transform data between formats',
        type: 'processor',
        category: 'transform' 
      },
      { 
        id: 'plugin-output-webhook', 
        name: 'Webhook',
        description: 'Send data to a webhook endpoint',
        type: 'output',
        category: 'integration' 
      },
      { 
        id: 'plugin-input-file', 
        name: 'File Input',
        description: 'Read data from files',
        type: 'input',
        category: 'data' 
      },
      { 
        id: 'plugin-input-api', 
        name: 'API Input',
        description: 'Create an API endpoint to receive data',
        type: 'input',
        category: 'integration' 
      }
    ];
    
    res.json(plugins);
  } catch (error) {
    console.error('Error fetching plugins:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 