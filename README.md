# Test Sphere - Frontend

A modern Next.js-based education platform frontend with offline-first proctoring capabilities.

## Features

- **Student Portal**: Join classes, take tests, and view assignments
- **Teacher Portal**: Create classes, manage tests, and view student submissions
- **Offline Support**: Full exam functionality with automatic backend sync when online
- **Real-time Proctoring**: Monitor students during exams with live streaming
- **Security**: JWT authentication, role-based access control, and encrypted offline storage

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your configuration:

```bash
cp .env.example .env.local
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

- `src/app/` - Next.js app router pages
- `src/components/` - Reusable React components
- `src/contexts/` - React Context providers
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `offline/` - Offline-first system (IndexedDB, sync engine, encryption)
- `public/` - Static assets

## Technologies

- **Framework**: Next.js 14+ with React 18+
- **Styling**: Tailwind CSS
- **UI Icons**: Lucide React
- **API Communication**: Fetch API
- **Authentication**: JWT (backend-managed)
- **Offline Storage**: IndexedDB
- **Real-time**: WebSocket/Socket.IO

## Backend API

The frontend communicates with the Test Sphere Backend API running on `http://localhost:5000`.

Key endpoints:

- `GET /health` - Health check
- `POST /auth/login` - User authentication
- `GET /class` - Fetch classes
- `POST /test/:id/submit` - Submit test answers
- `POST /proctoring-log` - Upload proctoring logs

## License

Proprietary - Test Sphere
