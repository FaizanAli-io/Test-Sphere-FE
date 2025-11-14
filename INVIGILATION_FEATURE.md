# Teacher Invigilation Interface - Implementation Guide

## Overview

This document describes the complete teacher invigilation interface that allows teachers to monitor students taking a test in real-time with WebRTC livestream capabilities.

## Features Implemented

### 1. **Invigilation Page** (`/test/[testId]/invigilate`)

- Displays all students currently taking a test
- Real-time polling (updates every 10 seconds)
- Responsive grid layout (1-6 columns based on screen size)
- Dark theme optimized for monitoring

### 2. **Student Grid Component**

- Responsive grid that adapts to screen size:
  - Mobile: 1 column
  - Small: 2 columns
  - Medium: 3 columns
  - Large: 4 columns
  - XL: 5 columns
  - 2XL: 6 columns
- Empty state when no students are taking the test

### 3. **Student Card Component**

Each card displays:

- Profile picture or initials (auto-generated from name)
- Student's full name
- Red "LIVE" indicator with pulsing animation
- Camera status icon (enabled/disabled)
- Microphone status icon (enabled/disabled)
- Hover effects with scale animation
- Click to open livestream modal

### 4. **Livestream Modal Component**

Features:

- Full-screen modal with backdrop
- Video player ready for WebRTC stream
- Connection status overlay ("Connecting to livestream...")
- Student information display (name, email, submission ID)
- Device status indicators (camera/mic on/off)
- Close button and backdrop click to dismiss
- Placeholder WebRTC logic ready for implementation

## File Structure

```
Test-Sphere-FE/
├── src/
│   ├── app/
│   │   └── (routes)/
│   │       └── test/
│   │           └── [testId]/
│   │               └── invigilate/
│   │                   └── page.tsx          # Main invigilation page
│   ├── components/
│   │   └── Invigilation/
│   │       ├── index.tsx                     # Component exports
│   │       ├── StudentCard.tsx               # Individual student card
│   │       ├── StudentGrid.tsx               # Grid layout component
│   │       └── StudentLivestreamModal.tsx    # Video modal component
│   └── hooks/
│       └── useInvigilateStudents.ts          # API hook for fetching students
```

## API Integration

### Endpoint Used

```
GET /tests/{testId}/invigilate
```

### Expected Response Format

```typescript
interface InvigilatingStudent {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  submissionId: number;
}
```

### Hook Features

- Automatic polling every 10 seconds
- Loading and error states
- Manual refetch capability
- Authentication included

## Navigation

### Access the Invigilation Interface

1. From the test detail page (`/test/[testId]`), click the **"📹 Invigilate"** button in the header
2. Or navigate directly to `/test/[testId]/invigilate`

### Navigation Flow

```
Test Detail Page → Invigilate Button → Invigilation Page
                                      ↓
                              Student Grid Display
                                      ↓
                              Click Student Card
                                      ↓
                              Livestream Modal Opens
```

## Styling

### Color Scheme

- Background: Dark gradient (gray-900 to gray-800)
- Cards: Gray-800 with gray-700 borders
- Accent: Yellow-500 (loading spinners, buttons)
- Live indicator: Red-500 with pulsing animation
- Status indicators: Green-400 (enabled), Gray-500 (disabled)

### Responsive Breakpoints

- `sm`: 640px (2 columns)
- `md`: 768px (3 columns)
- `lg`: 1024px (4 columns)
- `xl`: 1280px (5 columns)
- `2xl`: 1536px (6 columns)

## WebRTC Implementation (Placeholder)

### Current State

The modal includes placeholder logic for WebRTC:

```typescript
const startWebRTCConnection = async (studentId: number) => {
  console.log(`Starting WebRTC connection for student ${studentId}`);
  setConnectionStatus("connecting");

  // TODO: Implement actual WebRTC signaling
  // 1. Create RTCPeerConnection
  // 2. Exchange SDP offers/answers with backend
  // 3. Handle ICE candidates
  // 4. Attach remote stream to video element
};
```

### Next Steps for WebRTC Integration

1. **Create RTCPeerConnection**

```typescript
const peerConnection = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
```

2. **Handle Remote Stream**

```typescript
peerConnection.ontrack = (event) => {
  if (videoRef.current) {
    videoRef.current.srcObject = event.streams[0];
  }
};
```

3. **Signaling with Backend**

- Implement WebSocket connection for signaling
- Exchange SDP offers/answers
- Handle ICE candidates
- Manage connection lifecycle

4. **Error Handling**

- Connection failures
- Network issues
- Permission denials
- Stream interruptions

## Usage Example

### Teacher Workflow

1. **Navigate to Test**
   - Go to test detail page: `/test/1`

2. **Start Invigilation**
   - Click "📹 Invigilate" button
   - System fetches list of active students

3. **Monitor Students**
   - View all students in grid layout
   - See live indicators and device status
   - Grid updates automatically every 10 seconds

4. **View Individual Stream**
   - Click on any student card
   - Modal opens with video player
   - See connection status
   - View student details

5. **Close Stream**
   - Click X button or backdrop
   - Return to grid view

## Component Props

### StudentGrid

```typescript
interface StudentGridProps {
  students: InvigilatingStudent[];
  onStudentClick: (student: InvigilatingStudent) => void;
}
```

### StudentCard

```typescript
interface StudentCardProps {
  student: InvigilatingStudent;
  onClick: () => void;
}
```

### StudentLivestreamModal

```typescript
interface StudentLivestreamModalProps {
  student: InvigilatingStudent | null;
  onClose: () => void;
}
```

## State Management

### Page Level State

- `selectedStudent`: Currently selected student for livestream
- `students`: List of students from API
- `loading`: Loading state
- `error`: Error state

### Modal Level State

- `connectionStatus`: 'connecting' | 'connected' | 'failed'
- Video ref for stream attachment

## Performance Considerations

1. **Polling Optimization**
   - 10-second interval balances freshness and server load
   - Cleanup on component unmount

2. **Grid Rendering**
   - Efficient key-based rendering
   - Responsive layout with CSS Grid

3. **Modal Management**
   - Single modal instance
   - Proper cleanup on close
   - Video element lifecycle management

## Accessibility

- Semantic HTML structure
- Keyboard navigation support (modal close on Escape)
- ARIA labels for status indicators
- Focus management in modal
- Color contrast compliance

## Browser Compatibility

- Modern browsers with WebRTC support
- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

## Testing Checklist

- [ ] Page loads without errors
- [ ] Students fetch from API
- [ ] Grid displays correctly on all screen sizes
- [ ] Student cards show correct information
- [ ] Live indicators animate properly
- [ ] Device status icons display correctly
- [ ] Modal opens on card click
- [ ] Modal closes on X button click
- [ ] Modal closes on backdrop click
- [ ] Video element is present
- [ ] Connection status displays
- [ ] Polling updates work
- [ ] Manual refresh works
- [ ] Navigation back to test works
- [ ] Error states display properly

## Future Enhancements

1. **WebRTC Implementation**
   - Complete signaling logic
   - Handle multiple simultaneous streams
   - Add recording capability

2. **Advanced Features**
   - Grid/List view toggle
   - Search/filter students
   - Sort by name/status
   - Fullscreen video mode
   - Picture-in-picture support

3. **Monitoring Tools**
   - Attention alerts
   - Suspicious activity detection
   - Session recording
   - Screenshot capture

4. **Performance**
   - Virtual scrolling for large classes
   - Lazy loading of video streams
   - Bandwidth optimization

## Troubleshooting

### Students Not Appearing

- Check API endpoint is accessible
- Verify authentication token
- Ensure students are actively taking the test
- Check browser console for errors

### Modal Not Opening

- Verify student data structure
- Check for JavaScript errors
- Ensure modal state management is working

### Styling Issues

- Verify Tailwind CSS is properly configured
- Check for conflicting styles
- Ensure responsive classes are applied

## Support

For issues or questions:

1. Check browser console for errors
2. Verify API responses
3. Review component props
4. Check network requests in DevTools
