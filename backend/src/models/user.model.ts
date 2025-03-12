import pool from '../db';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  username: string;
  password: string;
  email?: string;
  created_at: Date;
}

export interface UserInput {
  username: string;
  password: string;
  email?: string;
}

export class UserModel {
  // Create users table if it doesn't exist
  static async initTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table initialized');
    } catch (error) {
      console.error('Error initializing users table:', error);
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username: string): Promise<User | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  // Create a new user
  static async create(userData: UserInput): Promise<User> {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const result = await pool.query(
        'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
        [userData.username, hashedPassword, userData.email || null]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
} 