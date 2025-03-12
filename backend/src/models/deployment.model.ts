import pool from '../db';

export interface Deployment {
  id?: number;
  name: string;
  host: string;
  port: string;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export class DeploymentModel {
  static async initTable() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS deployments (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          host VARCHAR(255) NOT NULL,
          port VARCHAR(20) NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS deployments_user_id_idx ON deployments(user_id);
      `);
    } finally {
      client.release();
    }
  }

  static async getByUserId(userId: number): Promise<Deployment[]> {
    const result = await pool.query(
      'SELECT * FROM deployments ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async getAll(): Promise<Deployment[]> {
    const result = await pool.query(`
      SELECT d.*, u.username as owner_username 
      FROM deployments d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `);
    return result.rows;
  }

  static async create(deployment: Deployment): Promise<Deployment> {
    const { name, host, port, user_id } = deployment;
    const result = await pool.query(
      'INSERT INTO deployments (name, host, port, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, host, port, user_id]
    );
    return result.rows[0];
  }

  static async getById(id: number, userId: number): Promise<Deployment | null> {
    const result = await pool.query(
      'SELECT * FROM deployments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows.length ? result.rows[0] : null;
  }

  static async update(id: number, userId: number, deployment: Partial<Deployment>): Promise<Deployment | null> {
    const { name, host, port } = deployment;
    const result = await pool.query(
      'UPDATE deployments SET name = $1, host = $2, port = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, host, port, id, userId]
    );
    return result.rows.length ? result.rows[0] : null;
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM deployments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows.length > 0;
  }
} 