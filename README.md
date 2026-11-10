
# StudySync

StudySync is a collaborative study platform where students can create and join study sessions. Each session has its own task board to organize and track study activities.

## Technology Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- Version Control: Git + GitHub

## Main Database Models

### User
Stores student information, including name, email, and password hash.

### Session
Stores study session details, including title, description, creator, participants, scheduled date, and status.

### Task
Stores tasks belonging to a session, including title, description, assigned user, status, priority, and due date.

## Project Structure

StudySync/
- client/ - React frontend
- server/ - Express backend
  - config/ - MongoDB connection
  - models/ - Mongoose database models
  - server.js - Backend entry point
  - .env.example - Environment variable template

## Installation

### 1. Clone the repository

git clone https://github.com/Emir-berke/StudySync.git

cd StudySync

### 2. Install frontend dependencies

cd client

npm install

npm run dev

Frontend: http://localhost:5173

### 3. Install backend dependencies

Open another terminal from the project root.

cd server

npm install

### 4. Configure environment variables

Copy server/.env.example to server/.env.

Set the following variables:

PORT=5000
MONGO_URI=your_mongodb_connection_string

Never commit .env to GitHub.

### 5. Start backend

From the server folder:

node server.js

Backend: http://localhost:5000

Health endpoint: http://localhost:5000/api/health

## Team Development Conventions

1. Never push directly to main.
2. Create a separate branch for each feature.
3. Use descriptive branch names:
   - feature/login
   - feature/sessions
   - feature/task-board
   - fix/database-error
4. Create a pull request when a feature is ready.
5. Review changes before merging into main.
6. Pull the latest main branch before starting new work.
7. Never commit passwords, .env files, or API secrets.
8. Keep frontend code in client/ and backend code in server/.
9. Use camelCase for JavaScript variables and functions.
10. Use PascalCase for React components and Mongoose model files.

## Git Workflow

Before starting a feature:

git checkout main
git pull origin main
git checkout -b feature/your-feature

After completing the feature:

git add .
git commit -m "Add feature description"
git push -u origin feature/your-feature

Then open a pull request on GitHub.

## Project Status

- React frontend initialized
- Express backend initialized
- MongoDB Atlas connection configured
- User, Session, and Task models created
- Feature development in progress


## API Testing

StudySync uses Jest and Supertest for automated API testing.

### Run Automated Tests

1. Open a terminal.
2. Navigate to the server folder:

   cd server

3. Run the tests:

   npx jest --runInBand

### Test Database

Automated database tests use a separate MongoDB database
named `studysync_test`.

Configure the following variables in `server/.env`:

- MONGO_URI: Main application database connection
- TEST_MONGO_URI: Separate test database connection

Never commit the `.env` file to GitHub.

### Manual API Testing

Talend API Tester is used to manually test API endpoints.

Health Check:
- Method: GET
- URL: http://localhost:5000/api/health
- Expected status: 200 OK

Expected response:

{
  "message": "StudySync API is running!",
  "status": "success"
}

Additional authentication, session, and task endpoints
will be documented as they are implemented.
