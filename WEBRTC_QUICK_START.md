# WebRTC Live Streaming - Quick Start Guide

## 🚀 Installation Steps

### 1. Install Backend Dependencies

```bash
cd Test-Sphere-BE
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### 2. Install Frontend Dependencies

```bash
cd Test-Sphere-FE
npm install socket.io-client
```

### 3. Start Backend

```bash
cd Test-Sphere-BE
npm run start:dev
```

### 4. Start Frontend

```bash
cd Test-Sphere-FE
npm run dev
```

## ✅ What Was Implemented

### Backend

- ✅ WebSocket signaling server (`/streaming` namespace)
- ✅ User registration (student/teacher roles)
- ✅ Stream session management
- ✅ Signal forwarding (WebRTC negotiation)
- ✅ Automatic cleanup on disconnect

### Frontend

#### For Teachers

- ✅ Invigilation page (`/test/[testId]/invigilate`)
- ✅ Student grid showing active test-takers
- ✅ Click student card to view livestream
- ✅ Real-time video player
- ✅ Connection status indicators
- ✅ Error handling with retry

#### For Students

- ✅ Streaming indicator during test
- ✅ Auto-start camera/microphone
- ✅ Minimizable status widget
- ✅ Connection status display
- ✅ Error handling with retry

## 📋 Testing the Implementation

### Step 1: Start a Test (as Teacher)

1. Login as teacher
2. Navigate to a test
3. Click "📹 Invigilate" button
4. You'll see the invigilation page

### Step 2: Take the Test (as Student)

1. Login as student (in different browser/incognito)
2. Start taking the test
3. Allow camera/microphone access when prompted
4. See streaming indicator in bottom-right corner

### Step 3: View Livestream (as Teacher)

1. On invigilation page, you'll see the student card
2. Click the student card
3. Modal opens with livestream
4. Video should start playing automatically

## 🔍 Verification Checklist

### Backend

- [ ] Server starts without errors
- [ ] WebSocket endpoint available at `ws://localhost:5000/streaming`
- [ ] Console shows "Client connected" when users join

### Frontend - Teacher

- [ ] Invigilation page loads
- [ ] Student cards appear when students take test
- [ ] Clicking card opens modal
- [ ] Video player shows connection status
- [ ] Stream plays when connected

### Frontend - Student

- [ ] Streaming indicator appears during test
- [ ] Browser requests camera/microphone permission
- [ ] Indicator shows "Streaming Active" when connected
- [ ] Can minimize/maximize indicator

## 🐛 Troubleshooting

### Issue: "Cannot find module 'socket.io-client'"

**Solution**: Run `npm install socket.io-client` in Test-Sphere-FE

### Issue: "Cannot find module '@nestjs/websockets'"

**Solution**: Run `npm install @nestjs/websockets @nestjs/platform-socket.io socket.io` in Test-Sphere-BE

### Issue: Camera permission denied

**Solution**:

- Check browser permissions
- Use HTTPS in production (required for camera access)
- Try different browser

### Issue: Video not showing

**Solution**:

- Check browser console for errors
- Verify WebSocket connection (should see "Socket connected" in console)
- Ensure both student and teacher are connected

### Issue: Connection fails

**Solution**:

- Check if backend is running
- Verify WebSocket URL in `useWebRTC.ts`
- Check firewall settings
- Try adding TURN server for NAT traversal

## 📊 Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Student        │         │  Backend         │         │  Teacher        │
│  Browser        │         │  (WebSocket)     │         │  Browser        │
├─────────────────┤         ├──────────────────┤         ├─────────────────┤
│                 │         │                  │         │                 │
│ 1. Register ────┼────────→│ Store socket ID  │         │                 │
│                 │         │                  │         │                 │
│                 │         │                  │←────────┼─ 2. Register    │
│                 │         │                  │         │                 │
│                 │         │                  │←────────┼─ 3. Request     │
│                 │         │                  │         │    Stream       │
│                 │         │                  │         │                 │
│ 4. Start ←──────┼─────────│ Forward request  │         │                 │
│    Camera       │         │                  │         │                 │
│                 │         │                  │         │                 │
│ 5. Create ──────┼────────→│ Forward offer ───┼────────→│ 6. Receive     │
│    Offer        │         │                  │         │    Offer        │
│                 │         │                  │         │                 │
│ 8. Receive ←────┼─────────│ Forward answer ←─┼─────────│ 7. Create      │
│    Answer       │         │                  │         │    Answer       │
│                 │         │                  │         │                 │
│ 9. P2P Video Stream ═══════════════════════════════════→│ 10. Display    │
│                 │         │                  │         │     Video       │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## 🎯 Key Features

### Modular Design

- ✅ Reusable `useWebRTC` hook
- ✅ Separate components for teacher/student
- ✅ Clean separation of concerns
- ✅ No code duplication

### Efficient Implementation

- ✅ Peer-to-peer connection (low latency)
- ✅ Automatic reconnection
- ✅ Session cleanup
- ✅ Minimal server load

### User Experience

- ✅ Auto-start streaming
- ✅ Clear status indicators
- ✅ Error handling with retry
- ✅ Minimizable UI elements

## 📝 Next Steps

### Optional Enhancements

1. **Add TURN Server** - Better NAT traversal
2. **Recording** - Save streams for later review
3. **Multiple Views** - View multiple students simultaneously
4. **Quality Controls** - Adjust video quality
5. **Screen Sharing** - Add screen capture alongside webcam

### Production Deployment

1. **Enable HTTPS** - Required for camera access
2. **Add TURN Server** - For reliable connections
3. **Load Balancing** - Scale WebSocket servers
4. **Monitoring** - Track connection quality
5. **Analytics** - Monitor usage and performance

## 📚 Documentation

- **Full Implementation Guide**: `WEBRTC_IMPLEMENTATION.md`
- **Backend Installation**: `Test-Sphere-BE/INSTALL_WEBSOCKET.md`
- **Frontend Installation**: `INSTALL_SOCKET_CLIENT.md`

## ✨ Summary

You now have a **fully functional WebRTC live streaming system** that:

- Connects students and teachers in real-time
- Uses peer-to-peer connections for low latency
- Handles errors gracefully
- Provides clear status indicators
- Works with your existing authentication system

**Ready to test!** 🎉
