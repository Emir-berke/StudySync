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

Stores the title, description, creator, participants, scheduled date, and status
for each study session. Related tasks use the Task model and are linked through
the task's `session` field.

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
TEST_MONGO_URI=your_studysync_test_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h

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

   npm test

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

## Authentication and User API

Authentication uses JSON Web Tokens. Send protected requests with the
following header:

`Authorization: Bearer <token>`

### Public authentication endpoints

| Method | Endpoint             | Purpose                                   |
| ------ | -------------------- | ----------------------------------------- |
| POST   | `/api/auth/register` | Create a student account and return a JWT |
| POST   | `/api/auth/login`    | Validate credentials and return a JWT     |

Registration requires `name`, `email`, and `password`. Passwords must be
8–72 characters and contain an uppercase letter, lowercase letter, and number.

### Protected user endpoints

| Method | Endpoint         | Access                                |
| ------ | ---------------- | ------------------------------------- |
| GET    | `/api/users/me`  | Authenticated user                    |
| GET    | `/api/users`     | Administrator only                    |
| GET    | `/api/users/:id` | The account owner or an administrator |
| PATCH  | `/api/users/:id` | The account owner or an administrator |
| DELETE | `/api/users/:id` | The account owner or an administrator |

Students can update their own name or email. Only administrators can change
the `role` field. Password hashes are never included in API responses.

### Study Session API

All session endpoints require `Authorization: Bearer <token>`. Session responses
include populated `createdBy` and `participants` summaries containing names and
email addresses, never password data. Related `tasks` are populated using their
`session` reference. The creator is automatically included in `participants`.

| Method | Endpoint                  | Access        | Purpose                                 |
| ------ | ------------------------- | ------------- | --------------------------------------- |
| GET    | `/api/sessions`           | Authenticated | Browse sessions, soonest first          |
| POST   | `/api/sessions`           | Authenticated | Create a session                        |
| GET    | `/api/sessions/:id`       | Authenticated | View session details                    |
| PATCH  | `/api/sessions/:id`       | Creator only  | Update title, description, date, status |
| DELETE | `/api/sessions/:id`       | Creator only  | Delete a session and its tasks          |
| POST   | `/api/sessions/:id/join`  | Authenticated | Join as a participant (safe to repeat)  |
| POST   | `/api/sessions/:id/leave` | Authenticated | Leave a session                         |

Create requests require `title` and `scheduledAt` (an ISO 8601 date-time).
`description` and `status` are optional; status defaults to `upcoming`. For example:

```json
{
  "title": "Biology review",
  "description": "Review cell structure.",
  "scheduledAt": "2027-05-10T18:30:00.000Z",
  "status": "upcoming"
}
```

#### Response Format

Successful list requests return `200` with a `sessions` array. Create returns
`201`; detail, update, join, and leave return `200` with one `session` object.
Delete returns `200` with a confirmation message.

```json
{
  "success": true,
  "sessions": [
    {
      "_id": "665000000000000000000001",
      "title": "Biology review",
      "description": "Review cell structure.",
      "createdBy": {
        "_id": "665000000000000000000002",
        "name": "Jordan Lee",
        "email": "jordan@example.com"
      },
      "participants": [
        {
          "_id": "665000000000000000000002",
          "name": "Jordan Lee",
          "email": "jordan@example.com"
        }
      ],
      "scheduledAt": "2027-05-10T18:30:00.000Z",
      "status": "upcoming",
      "tasks": [
        {
          "_id": "665000000000000000000003",
          "title": "Read chapter 4",
          "description": "Review the assigned chapter.",
          "session": "665000000000000000000001",
          "assignedTo": {
            "_id": "665000000000000000000002",
            "name": "Jordan Lee",
            "email": "jordan@example.com"
          },
          "status": "todo",
          "priority": "medium",
          "dueDate": null
        }
      ]
    }
  ]
}
```

Single-session responses use the same session shape under `session`, for example
`{ "success": true, "session": { ... } }`. Delete responds with:

```json
{ "success": true, "message": "Session deleted" }
```

Errors use `{ "success": false, "message": "..." }`. Validation errors also
include `errors`, an array of `{ "field", "message" }` objects.

Each session's `tasks` array contains Task records with `title`, `description`,
`session`, `assignedTo`, `status`, `priority`, and optional `dueDate`, following
the shape in `server/seeds/sampleTasks.js`.

Validation failures and malformed session IDs return `400`; missing sessions
return `404`; missing or invalid authentication returns `401`; non-owners who
attempt to edit or delete return `403`.

### Tasks API

All task endpoints require authentication using a JSON Web Token (JWT).

Send the token in the request header:

`Authorization: Bearer <token>`

Tasks belong to a study session and are connected through the `session` field.

#### Task Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks` | Retrieve tasks from sessions the user belongs to |
| GET | `/api/tasks?status=todo` | Filter tasks by status |
| GET | `/api/tasks/:id` | Retrieve a specific task |
| PUT | `/api/tasks/:id` | Update task details |
| PUT | `/api/tasks/:id/status` | Update task status |
| PUT | `/api/tasks/:id/assign` | Assign or unassign a task |
| DELETE | `/api/tasks/:id` | Delete a task |

#### Task Fields

| Field | Description |
|---|---|
| title | Task title |
| description | Task description |
| session | Study session associated with the task |
| assignedTo | User assigned to the task (can be null) |
| status | Task progress |
| priority | Task priority |
| dueDate | Task due date (can be null) |

#### Task Status

Available status values:

- `todo` – Task has not been started.
- `in-progress` – Task is currently being worked on.
- `done` – Task has been completed.

#### Task Priority

Available priority values:

- `low`
- `medium`
- `high`

#### Access Control

- All task endpoints require authentication.
- Users can view tasks belonging to sessions they participate in.
- Only session owners can create, update, assign, change the status of, or delete tasks.
- Tasks can only be assigned to members of the associated study session.
- Tasks can be unassigned by setting `assignedTo` to null.

#### Response Format

Successful responses return a success indicator and the relevant task information.

Task lists return:

```json
{
  "success": true,
  "tasks": []
}
```

Individual task operations return:

```json
{
  "success": true,
  "task": {}
}
```

Successful task creation returns `201`. Other successful operations return `200`.

Errors return a success indicator of false and an error message. Depending on the issue, responses may include:

- `400` – Invalid input, task ID, or status.
- `401` – Authentication required or invalid.
- `403` – User does not have permission.
- `404` – Task or session not found.

#### Automated Testing

The Tasks API was tested using Jest and Supertest.

Tests cover:

- Creating, retrieving, updating, and deleting tasks.
- Filtering tasks by status.
- Updating task status.
- Assigning and unassigning tasks.
- Authentication and authorization.
- Session membership restrictions.
- Invalid task IDs and validation errors.


### Session Client

The current React client in `client/` is temporary integration scaffolding for
exercising the session API. Its screens and styling are not a finished product
UI and are expected to be replaced. The session API and data contract above are
the implementation reference; the client can be redesigned or replaced without
changing that contract.
