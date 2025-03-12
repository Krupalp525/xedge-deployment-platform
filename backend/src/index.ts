import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { UserModel } from './models/user.model';
import { DeploymentModel } from './models/deployment.model';
import authRoutes from './routes/auth.routes';
import deploymentRoutes from './routes/deployment.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
const initDb = async () => {
  try {
    await UserModel.initTable();
    await DeploymentModel.initTable();
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deployments', deploymentRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'XEdge API is running' });
});

// Start server
const startServer = async () => {
  await initDb();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
}); 