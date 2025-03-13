import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { DeploymentModel } from '../models/deployment.model';
import { WorkflowModel } from '../models/workflow.model';
import pool from '../db';

const router = Router();

// Get all deployments for all users
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // Get all deployments for all users
    const deployments = await DeploymentModel.getAll();
    res.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new deployment
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { name, host, port } = req.body;
    if (!name || !host || !port) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const deployment = await DeploymentModel.create({
      name,
      host,
      port,
      user_id: req.user.id,
    });
    
    res.status(201).json(deployment);
  } catch (error) {
    console.error('Error adding deployment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific deployment
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid deployment ID' });
      return;
    }

    // Modified to get deployment by ID only, without user_id restriction
    const result = await pool.query(
      'SELECT * FROM deployments WHERE id = $1',
      [id]
    );
    const deployment = result.rows.length ? result.rows[0] : null;
    
    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    res.json(deployment);
  } catch (error) {
    console.error('Error fetching deployment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a deployment
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { name, host, port } = req.body;
    if (!name || !host || !port) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid deployment ID' });
      return;
    }

    // Modified to update any deployment, not just owned by the user
    const result = await pool.query(
      'UPDATE deployments SET name = $1, host = $2, port = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, host, port, id]
    );
    const deployment = result.rows.length ? result.rows[0] : null;
    
    if (!deployment) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    res.json(deployment);
  } catch (error) {
    console.error('Error updating deployment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a deployment
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid deployment ID' });
      return;
    }

    // Modified to delete any deployment, not just owned by the user
    const result = await pool.query(
      'DELETE FROM deployments WHERE id = $1 RETURNING id',
      [id]
    );
    const deleted = result.rows.length > 0;
    
    if (!deleted) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    res.json({ message: 'Deployment deleted successfully' });
  } catch (error) {
    console.error('Error deleting deployment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a deployment's workflow
router.get('/:id/workflow', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid deployment ID' });
      return;
    }

    // Check if deployment exists
    const deploymentResult = await pool.query(
      'SELECT * FROM deployments WHERE id = $1',
      [id]
    );
    
    if (deploymentResult.rows.length === 0) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    // Get workflow for deployment
    const workflow = await WorkflowModel.getByDeploymentId(id);
    
    // If workflow doesn't exist, return empty elements array
    if (!workflow) {
      res.json({ elements: [] });
      return;
    }

    res.json(workflow.workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a deployment's workflow
router.put('/:id/workflow', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid deployment ID' });
      return;
    }

    // Check if deployment exists
    const deploymentResult = await pool.query(
      'SELECT * FROM deployments WHERE id = $1',
      [id]
    );
    
    if (deploymentResult.rows.length === 0) {
      res.status(404).json({ error: 'Deployment not found' });
      return;
    }

    // Validate that all nodes in the workflow have IDs
    const { elements } = req.body;
    
    if (!elements || !Array.isArray(elements)) {
      res.status(400).json({ error: 'Workflow elements must be an array' });
      return;
    }
    
    // Check if any node is missing an ID
    if (!elements.every(node => node.id)) {
      return res.status(400).json({ error: 'All nodes must have an id' });
    }

    // Save workflow using the model
    await WorkflowModel.saveWorkflow(id, req.body);

    res.json({ message: 'Workflow saved successfully' });
  } catch (error) {
    console.error('Error saving workflow:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;