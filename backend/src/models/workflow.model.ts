import pool from '../db';

export interface Workflow {
  deployment_id: number;
  workflow: {
    elements: Array<{
      id: string;
      type: string;
      position: {
        x: number;
        y: number;
      };
      data: {
        pluginId?: string;
        label?: string;
        config?: Record<string, any>;
      };
    }>;
  };
  created_at?: Date;
  updated_at?: Date;
}

export class WorkflowModel {
  static async initTable() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS deployment_workflows (
          deployment_id INTEGER REFERENCES deployments(id) ON DELETE CASCADE,
          workflow JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (deployment_id)
        );
      `);
    } finally {
      client.release();
    }
  }

  static async getByDeploymentId(deploymentId: number): Promise<Workflow | null> {
    const result = await pool.query(
      'SELECT * FROM deployment_workflows WHERE deployment_id = $1',
      [deploymentId]
    );
    return result.rows.length ? result.rows[0] : null;
  }

  static async saveWorkflow(deploymentId: number, workflow: any): Promise<Workflow> {
    // Upsert workflow
    const result = await pool.query(
      `INSERT INTO deployment_workflows (deployment_id, workflow) 
       VALUES ($1, $2) 
       ON CONFLICT (deployment_id) 
       DO UPDATE SET workflow = $2, updated_at = NOW()
       RETURNING *`,
      [deploymentId, workflow]
    );
    return result.rows[0];
  }
} 