# TodoList Backend REST API

Node.js and Express REST API with MongoDB (Mongoose ODM) for task and workflow management, featuring external public API integrations.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Utilities:** CORS, Morgan, Dotenv

## REST API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks (supports `search`, `status`, `priority`, `category`, `sortBy`)
- `GET /api/tasks/:id` - Get single task by ID
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update task details
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion state

### System & Integrations
- `GET /api/health` - Health check & MongoDB connection status
- `GET /api/external/weather` - Live weather data & productivity recommendations (Open-Meteo)
- `GET /api/external/github/issues` - Fetch public repository issues (GitHub REST API)

## Database Schema (Task Model)

- `title`: String (required, max 150 chars)
- `description`: String
- `completed`: Boolean (default: false)
- `status`: String ('pending' | 'in-progress' | 'completed')
- `priority`: String ('low' | 'medium' | 'high' | 'urgent')
- `category`: String ('Work' | 'Personal' | 'Development' | 'Design' | 'General')
- `dueDate`: Date
- `tags`: Array of Strings
- `timestamps`: createdAt, updatedAt

## Setup & Running

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev

# Run in production
npm start
```

The server runs on `http://localhost:5000` by default.

