# WebRTC Live Streaming Implementation

## Overview

Complete WebRTC implementation for live streaming between students and teachers during tests.

## Architecture

```
Student Browser          Backend (WebSocket)          Teacher Browser
     📹                        🔄                            👁️
     |                         |                             |
     |-- Register -----------→ |                             |
     |                         | ←----------- Register ------|
     |                         |                             |
     |                         | ←-- Request Stream ---------|
     |← Stream Request --------|                             |
     |                         |                             |
     |-- Offer -------------→  |-- Forward Offer ----------→ |
     |                         |                             |
     | ←-- Answer -------------|← Forward Answer ------------|
     |                         |                             |
     |-- ICE Candidates ----→  |-- Forward ICE -----------→  |
     |                         |                             |
     |============ Direct P2P Video Stream ===============→  |
```

## Components Implemented

### Backend (NestJS)

#### 1. **StreamingGateway** (`src/streaming/streaming.gateway.ts`)

WebSocket gateway for signaling:

- User registration (student/teacher)
- Stream session management
- Signal forwarding (offer/answer/ICE)
- Connection cleanup

**Key Events:**

- `register` - Register user with role and test ID
- `start-stream` - Teacher requests student stream
- `signal` - Forward WebRTC signaling messages
- `stop-stream` - End streaming session
- `get-active-sessions` - Get active streaming sessions

#### 2. **StreamingModule** (`src/streaming/streaming.module.ts`)

Module configuration for streaming functionality

### Frontend (Next.js + React)

#### 1. **useWebRTC Hook** (`src/hooks/useWebRTC.ts`)

Custom hook for WebRTC functionality:

- Socket.IO connection management
- Peer connection creation
- Media stream handling
- Signaling message handling

**For Teachers:**

- `requestStream(studentId)` - Request stream from student
- `stopViewingStream(studentId)` - Stop viewing stream
- `remoteStream` - Access to student's stream

**For Students:**

- `startStreaming()` - Start camera/microphone
- `stopStreaming()` - Stop streaming
- `localStream` - Access to own stream

#### 2. **StudentLivestreamModal** (Enhanced)

Modal for teachers to view student streams:

- Real-time connection status
- Video player with remote stream
- Error handling and retry
- Connection state indicators

#### 3. **StreamingIndicator** (`src/components/GiveTest/components/StreamingIndicator.tsx`)

Indicator for students during test:

- Shows streaming status
- Minimizable widget
- Auto-starts streaming
- Error handling with retry

## Data Flow

### 1. Teacher Opens Invigilation Page

```typescript
// Teacher connects to WebSocket
socket.emit("register", {
  userId: teacherId,
  role: "teacher",
  testId: testId,
});
```

### 2. Student Starts Test

```typescript
// Student connects to WebSocket
socket.emit("register", {
  userId: studentId,
  role: "student",
  testId: testId,
});

// Auto-start streaming
await startStreaming(); // Gets camera/mic access
```

### 3. Teacher Clicks Student Card

```typescript
// Teacher requests stream
socket.emit("start-stream", {
  studentId: studentId,
  teacherId: teacherId,
  testId: testId,
});

// Backend notifies student
socket.to(studentSocketId).emit("stream-request", {
  teacherId: teacherId,
  testId: testId,
});
```

### 4. WebRTC Negotiation

```typescript
// Student creates offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

socket.emit("signal", {
  type: "offer",
  data: offer,
  from: studentId,
  to: teacherId,
});

// Teacher receives offer and creates answer
await peerConnection.setRemoteDescription(offer);
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

socket.emit("signal", {
  type: "answer",
  data: answer,
  from: teacherId,
  to: studentId,
});

// ICE candidates exchanged automatically
```

### 5. Stream Established

```typescript
// Teacher's video element receives stream
videoRef.current.srcObject = remoteStream;
```

## Installation

### Backend

```bash
cd Test-Sphere-BE
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm run start:dev
```

### Frontend

```bash
cd Test-Sphere-FE
npm install socket.io-client
npm run dev
```

## Configuration

### Backend WebSocket URL

Default: `ws://localhost:5000/streaming`

To change, update in `Test-Sphere-FE/src/hooks/useWebRTC.ts`:

```typescript
const wsUrl = API_BASE_URL.replace("http", "ws") + "/streaming";
```

### STUN/TURN Servers

Default uses Google's public STUN servers.

To add TURN servers (for better NAT traversal), update in `useWebRTC.ts`:

```typescript
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478",
      username: "username",
      credential: "password",
    },
  ],
};
```

## Usage

### For Teachers

1. Navigate to test invigilation page: `/test/[testId]/invigilate`
2. See all students currently taking the test
3. Click any student card to open livestream
4. Video automatically connects and plays
5. Close modal to stop viewing

### For Students

1. Start taking a test: `/give-test/[testId]`
2. Streaming indicator appears automatically
3. Camera/microphone access requested
4. Streaming starts automatically when teacher views
5. Indicator shows connection status

## Features

### Connection Management

- ✅ Automatic reconnection on disconnect
- ✅ Session cleanup on page close
- ✅ Multiple teachers can view same student
- ✅ Graceful error handling

### Security

- ✅ Authentication required (JWT tokens)
- ✅ Role-based access (student/teacher)
- ✅ Test-specific sessions
- ✅ Encrypted WebRTC streams

### Performance

- ✅ Peer-to-peer connection (low latency)
- ✅ Efficient signaling
- ✅ Automatic quality adjustment
- ✅ Minimal server load

## Troubleshooting

### Camera/Microphone Not Working

**Issue**: Browser doesn't request permissions
**Solution**:

- Ensure HTTPS in production (required for getUserMedia)
- Check browser permissions
- Try different browser

### Connection Fails

**Issue**: Peers can't connect
**Solution**:

- Check firewall settings
- Add TURN server for NAT traversal
- Verify WebSocket connection

### No Video Appears

**Issue**: Stream not displaying
**Solution**:

- Check browser console for errors
- Verify WebSocket connection
- Check ICE candidate exchange

### High Latency

**Issue**: Delayed video
**Solution**:

- Add TURN server closer to users
- Check network bandwidth
- Reduce video quality

## Testing

### Test WebSocket Connection

```javascript
// In browser console
const socket = io("ws://localhost:5000/streaming");
socket.on("connect", () => console.log("Connected!"));
```

### Test Camera Access

```javascript
// In browser console
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => console.log("Camera works!", stream))
  .catch((err) => console.error("Camera error:", err));
```

### Test Peer Connection

```javascript
// In browser console
const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
console.log("Peer connection created:", pc);
```

## Browser Compatibility

| Browser | Version | Support |
| ------- | ------- | ------- |
| Chrome  | 56+     | ✅ Full |
| Firefox | 52+     | ✅ Full |
| Safari  | 11+     | ✅ Full |
| Edge    | 79+     | ✅ Full |

## Production Considerations

### 1. HTTPS Required

WebRTC requires HTTPS in production:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /streaming {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 2. TURN Server

For production, deploy a TURN server:

```bash
# Using coturn
apt-get install coturn
```

Configure in `/etc/turnserver.conf`:

```
listening-port=3478
external-ip=YOUR_SERVER_IP
realm=your-domain.com
```

### 3. Scaling

For multiple servers, use Redis adapter:

```typescript
// Backend
import { RedisIoAdapter } from "@nestjs/platform-socket.io";

app.useWebSocketAdapter(new RedisIoAdapter(app));
```

### 4. Monitoring

Add logging and monitoring:

```typescript
// Track active sessions
console.log("Active sessions:", activeSessions.size);

// Monitor connection quality
peerConnection.getStats().then((stats) => {
  // Analyze connection quality
});
```

## API Reference

### WebSocket Events

#### Client → Server

**register**

```typescript
{
  userId: string;
  role: "student" | "teacher";
  testId: number;
}
```

**start-stream**

```typescript
{
  studentId: string;
  teacherId: string;
  testId: number;
}
```

**signal**

```typescript
{
  type: "offer" | "answer" | "ice-candidate";
  data: RTCSessionDescription | RTCIceCandidate;
  from: string;
  to: string;
  testId: number;
  role: "student" | "teacher";
}
```

**stop-stream**

```typescript
{
  studentId: string;
  teacherId: string;
  testId: number;
}
```

#### Server → Client

**registered**

```typescript
{
  success: boolean;
  socketId: string;
}
```

**stream-request**

```typescript
{
  teacherId: string;
  testId: number;
}
```

**signal**

```typescript
{
  type: "offer" | "answer" | "ice-candidate";
  data: any;
  from: string;
}
```

**stream-stopped**

```typescript
{
  reason?: string;
  studentId?: string;
  teacherId?: string;
}
```

## Summary

✅ **Complete WebRTC Implementation**

- Backend signaling server
- Frontend WebRTC hooks
- Teacher viewing interface
- Student streaming indicator

✅ **Production-Ready Features**

- Error handling
- Reconnection logic
- Session management
- Security measures

✅ **Easy to Use**

- Auto-connects on page load
- Auto-starts streaming
- Minimal configuration
- Clear status indicators

The live streaming system is now fully functional and ready for testing!
