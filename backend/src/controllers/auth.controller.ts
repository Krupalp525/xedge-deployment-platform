import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, UserInput } from '../models/user.model';
import dotenv from 'dotenv';

// Define the AuthRequest interface here to ensure user property is recognized
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, email } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
      }

      // Check if user already exists
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      // Create user
      const userData: UserInput = { username, password, email };
      const user = await UserModel.create(userData);

      // Create JWT token
      const payload = {
        user: {
          id: user.id,
          username: user.username
        }
      };

      jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
      }

      // Check if user exists
      const user = await UserModel.findByUsername(username);
      if (!user) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isMatch = await UserModel.verifyPassword(password, user.password);
      if (!isMatch) {
        res.status(400).json({ message: 'Invalid credentials' });
        return;
      }

      // Create JWT token
      const payload = {
        user: {
          id: user.id,
          username: user.username
        }
      };

      jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user: { id: user.id, username: user.username } });
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get current user
  static getCurrentUser(req: AuthRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
      }

      const userId = req.user.id;
      
      // Get user by ID (excluding password)
      UserModel.findByUsername(req.user.username)
        .then(result => {
          if (!result) {
            res.status(404).json({ message: 'User not found' });
            return;
          }

          // Return user data without password
          const { password, ...userData } = result;
          res.json(userData);
        })
        .catch(error => {
          console.error('Get current user error:', error);
          res.status(500).json({ message: 'Server error' });
        });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
} 