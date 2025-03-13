# Xedge Deployment Management Platform

A modern web application for managing edge deployments with a user-friendly interface.

## Features

- **User Authentication**: Secure login and registration system
- **Deployment Management**: Add, edit, and delete edge deployments
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
└── backend/             # Node.js backend API
    ├── src/
    │   ├── controllers/ # Request handlers 
    │   ├── models/      # Database models
    │   ├── routes/      # API routes
    │   └── middleware/  # Custom middleware
    └── ...
```

## Technologies

### Frontend
- React
- React Router
- Axios
- CSS Modules
- Font Awesome

### Backend
- Node.js
- Express
- PostgreSQL
- JSON Web Tokens (JWT)
- Node.js Crypto (for password hashing)

## Setup and Installation

### Prerequisites
- Node.js (v14+)
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

## License

MIT 