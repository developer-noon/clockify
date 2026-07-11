# Time Tracking App

A full-stack time tracking application built with React, Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Client & project management
- Time entry tracking with timer
- Detailed reports and analytics
- PDF export functionality
- Shareable client links
- Mobile responsive design

## Tech Stack

### Backend

- Node.js + Express.js
- MongoDB database
- TypeScript
- JWT authentication
- PDFKit for PDF generation

### Frontend

- React 18
- TypeScript
- TailwindCSS
- Vite
- React Router
- Axios

## Setup Instructions

### Prerequisites

- Node.js 16+
- MongoDB database (Atlas or local)
- npm or yarn

### Backend Setup

1. Navigate to backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file with a MongoDB connection string:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/clockify
MONGODB_DB=clockify
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Important: this project uses MongoDB through the official `mongodb` driver.

4. Initialize database:

```bash
npm run db:init
```

5. Start development server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

4. Start development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Business logic
│   ├── routes/         # API routes
│   ├── middleware/      # Auth middleware
│   ├── models/         # Database queries
│   ├── utils/          # Utilities
│   ├── db.ts           # Database connection
│   └── index.ts        # Server entry point
└── package.json

frontend/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── context/        # React context
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── types/          # TypeScript types
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── index.html
└── package.json
```

## Key Features

### Authentication

- User registration and login
- JWT token-based authentication
- Protected API endpoints

### Time Tracking

- Add time entries manually
- Track time by client, project, and task
- Billable/non-billable tracking
- Full CRUD operations

### Reports

- Summarized time tracking reports
- Filter by date range, client, and project
- Detailed entry breakdown
- Export to PDF

### Sharing

- Generate shareable client links
- Public view without authentication
- Revoke access anytime

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Clients

- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Projects

- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:projectId/tasks` - Get tasks

### Time Entries

- `GET /api/time-entries` - List entries
- `PUT /api/time-entries/:id` - Update entry
- `DELETE /api/time-entries/:id` - Delete entry

### Reports

- `GET /api/reports/summary` - Get summary report
- `GET /api/reports/detailed` - Get detailed report
- `GET /api/reports/pdf` - Download PDF

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
