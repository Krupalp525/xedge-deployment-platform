# Xedge Deployment Management Platform

A modern web application for managing edge deployments with a user-friendly interface.

## Features

- **User Authentication**: Secure login and registration system
- **Deployment Management**: Add, edit, and delete edge deployments
- **Workflow Designer**: Visual workflow editor with drag-and-drop functionality
- **Plugin System**: Extensible architecture for adding new plugins
- **Shared Access**: All authenticated users can view and manage deployments
- **Modern UI**: Clean, intuitive interface with responsive design

## Project Structure

```
/
├── frontend/            # React frontend application
│   ├── public/          # Static assets
│   └── src/             # React source code
│       ├── components/  # UI components
│       └── ...
├── backend/             # Node.js backend API
│   ├── src/
│   │   ├── controllers/ # Request handlers 
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   └── middleware/  # Custom middleware
│   └── ...
└── .github/             # GitHub configuration
    └── workflows/       # CI/CD workflows
```

## Technologies

### Frontend
- React
- Material-UI
- React Flow
- Axios
- TypeScript

### Backend
- Node.js
- Express
- PostgreSQL
- JSON Web Tokens (JWT)
- Node.js Crypto (for password hashing)
- TypeScript

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Quick Start
1. Install all dependencies from the root directory:
   ```
   npm run install:all
   ```
2. Set up your database configuration in `backend/.env`
3. Start both frontend and backend:
   ```
   npm start
   ```

### Manual Setup

#### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   POSTGRES_USER=your_db_username
   POSTGRES_PASSWORD=your_db_password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=xedge
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```
4. Start the development server:
   ```
   npm start
   ```

#### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Register or log in to your account
2. Navigate to the Deployments page
3. Add new deployments using the "Add Deployment" button
4. Edit or delete existing deployments using the controls on each card
5. Click on a deployment to access its workflow editor
6. Use the sidebar plugins to drag and drop nodes onto the workflow canvas
7. Connect nodes by dragging from one node's output to another node's input
8. Save your workflow using the "Save Workflow" button

## Continuous Integration

This project uses GitHub Actions for continuous integration. The workflow automatically:

1. Runs linting checks
2. Builds the frontend and backend
3. Executes tests

To view the CI status, check the Actions tab in the GitHub repository.

## Development

### Testing Workflow Validation

The backend includes validation to ensure workflow nodes have valid IDs. To test this functionality:

1. Start the backend server
2. Run the validation test script:
   ```
   cd backend
   node test-workflow-validation.js
   ```

## Contributing

1. Fork the repository
2. Create a new feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## License

MIT 