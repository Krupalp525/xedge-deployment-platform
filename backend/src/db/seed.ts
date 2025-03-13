import { UserModel } from '../models/user.model';
import { DeploymentModel } from '../models/deployment.model';
import { WorkflowModel } from '../models/workflow.model';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Seed the database with a test user and deployment
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Initialize tables
    await UserModel.initTable();
    await DeploymentModel.initTable();
    await WorkflowModel.initTable();
    
    console.log('Tables initialized');
    
    // Create test user if it doesn't exist
    const existingUser = await UserModel.findByUsername('admin');
    
    if (!existingUser) {
      console.log('Creating test user: admin');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password', salt);
      
      // Create user
      await UserModel.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com'
      });
      
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }
    
    // Create a test deployment if none exists
    const deployments = await DeploymentModel.getAll();
    if (deployments.length === 0) {
      console.log('Creating test deployment...');
      const deployment = await DeploymentModel.create({
        name: 'Test Deployment',
        host: 'localhost',
        port: '8080',
        user_id: existingUser?.id || 1
      });
      console.log('Test deployment created with ID:', deployment.id);
      
      // Initialize an empty workflow for the deployment
      if (deployment && deployment.id) {
        await WorkflowModel.saveWorkflow(deployment.id, { elements: [] });
        console.log('Empty workflow created for the deployment');
      }
    } else {
      console.log(`${deployments.length} deployments already exist`);
    }
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log('Seed script completed');
  process.exit(0);
}).catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
}); 