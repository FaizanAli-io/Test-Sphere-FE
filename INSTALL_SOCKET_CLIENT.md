# Socket.IO Client Installation

## Required Package

Run the following command in the `Test-Sphere-FE` directory:

```bash
npm install socket.io-client
```

## What This Package Does

- `socket.io-client` - WebSocket client library for real-time communication with the backend

## After Installation

Restart your frontend development server:

```bash
npm run dev
```

The frontend will connect to the WebSocket server at:

```
ws://localhost:5000/streaming
```
