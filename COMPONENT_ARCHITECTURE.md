# Invigilation Feature - Component Architecture

## Component Hierarchy

```
InvigilatePage (/test/[testId]/invigilate)
│
├── Header Section
│   ├── Back Button (→ /test/[testId])
│   ├── Title: "Test Invigilation"
│   ├── Student Count
│   └── Refresh Button
│
├── StudentGrid
│   └── StudentCard[] (multiple)
│       ├── Live Indicator (animated)
│       ├── Profile Picture / Initials
│       ├── Student Name
│       └── Device Status Icons
│           ├── Camera Icon
│           └── Microphone Icon
│
└── StudentLivestreamModal (conditional)
    ├── Modal Header
    │   ├── Student Name
    │   ├── Live Indicator
    │   └── Close Button (X)
    │
    ├── Video Container
    │   ├── <video> element
    │   ├── Connection Status Overlay
    │   └── Device Status Indicators
    │
    └── Modal Footer
        ├── Student Email
        └── Submission ID
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      InvigilatePage                         │
│                                                             │
│  State:                                                     │
│  - students: InvigilatingStudent[]                         │
│  - selectedStudent: InvigilatingStudent | null             │
│  - loading: boolean                                        │
│  - error: string | null                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ uses
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  useInvigilateStudents Hook                 │
│                                                             │
│  Responsibilities:                                          │
│  - Fetch students from API                                 │
│  - Auto-refresh every 10 seconds                           │
│  - Handle loading/error states                             │
│  - Provide refetch function                                │
│                                                             │
│  Returns:                                                   │
│  - students: InvigilatingStudent[]                         │
│  - loading: boolean                                        │
│  - error: string | null                                    │
│  - refetch: () => void                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ calls
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│                                                             │
│  GET /tests/{testId}/invigilate                            │
│  Authorization: Bearer {token}                             │
│                                                             │
│  Returns: InvigilatingStudent[]                            │
└─────────────────────────────────────────────────────────────┘
```

## Component Props Flow

```
InvigilatePage
    │
    ├─→ StudentGrid
    │       Props:
    │       - students: InvigilatingStudent[]
    │       - onStudentClick: (student) => void
    │       │
    │       └─→ StudentCard (for each student)
    │               Props:
    │               - student: InvigilatingStudent
    │               - onClick: () => void
    │
    └─→ StudentLivestreamModal
            Props:
            - student: InvigilatingStudent | null
            - onClose: () => void
```

## State Management

### Page Level State

```typescript
// InvigilatePage
const [selectedStudent, setSelectedStudent] =
  useState<InvigilatingStudent | null>(null);
const { students, loading, error, refetch } = useInvigilateStudents(testId);
```

### Hook Level State

```typescript
// useInvigilateStudents
const [students, setStudents] = useState<InvigilatingStudent[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Modal Level State

```typescript
// StudentLivestreamModal
const [connectionStatus, setConnectionStatus] = useState<
  "connecting" | "connected" | "failed"
>("connecting");
const videoRef = useRef<HTMLVideoElement>(null);
```

## Event Flow

### 1. Page Load

```
User navigates to /test/[testId]/invigilate
    ↓
InvigilatePage mounts
    ↓
useInvigilateStudents hook initializes
    ↓
API call: GET /tests/{testId}/invigilate
    ↓
Students data received
    ↓
StudentGrid renders with StudentCards
    ↓
Auto-refresh timer starts (10s interval)
```

### 2. Student Card Click

```
User clicks StudentCard
    ↓
onClick handler fires
    ↓
onStudentClick(student) called
    ↓
setSelectedStudent(student)
    ↓
StudentLivestreamModal renders
    ↓
useEffect in modal triggers
    ↓
startWebRTCConnection(student.id)
    ↓
Video connection initiated (placeholder)
```

### 3. Modal Close

```
User clicks X button or backdrop
    ↓
onClose handler fires
    ↓
setSelectedStudent(null)
    ↓
Modal unmounts
    ↓
useEffect cleanup runs
    ↓
WebRTC connection closed (when implemented)
```

### 4. Auto Refresh

```
10 seconds elapsed
    ↓
setInterval callback fires
    ↓
fetchStudents() called
    ↓
API call: GET /tests/{testId}/invigilate
    ↓
Students data updated
    ↓
StudentGrid re-renders with new data
```

## Type Definitions

```typescript
// Core student interface
interface InvigilatingStudent {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  submissionId: number;
}

// Hook return type
interface UseInvigilateStudentsReturn {
  students: InvigilatingStudent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Component prop types
interface StudentGridProps {
  students: InvigilatingStudent[];
  onStudentClick: (student: InvigilatingStudent) => void;
}

interface StudentCardProps {
  student: InvigilatingStudent;
  onClick: () => void;
}

interface StudentLivestreamModalProps {
  student: InvigilatingStudent | null;
  onClose: () => void;
}
```

## Styling Architecture

### Tailwind Classes by Component

#### InvigilatePage

```css
- Container: "min-h-screen bg-gradient-to-br from-gray-900 to-gray-800"
- Content: "container mx-auto px-4 py-8 max-w-7xl"
- Header: "mb-8"
- Title: "text-3xl font-bold text-white mb-2"
```

#### StudentGrid

```css
- Grid: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
- Empty state: "text-center py-16"
```

#### StudentCard

```css
- Card: "bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-all hover:scale-105 hover:shadow-xl border border-gray-700"
- Live badge: "bg-red-500 text-white text-xs px-2 py-1 rounded-full"
- Profile: "w-20 h-20 rounded-full"
- Name: "text-white text-center font-semibold text-lg"
```

#### StudentLivestreamModal

```css
- Backdrop: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
- Modal: "bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh]"
- Header: "bg-gray-800 px-6 py-4 border-b border-gray-700"
- Video: "relative bg-black aspect-video"
```

## Responsive Breakpoints

```
Mobile First Approach:

Default (< 640px):     1 column
sm (≥ 640px):          2 columns
md (≥ 768px):          3 columns
lg (≥ 1024px):         4 columns
xl (≥ 1280px):         5 columns
2xl (≥ 1536px):        6 columns
```

## Performance Optimizations

### 1. Efficient Rendering

- Key-based rendering in StudentGrid
- Memoization opportunities for StudentCard
- Conditional rendering of modal

### 2. API Optimization

- Request deduplication in useApi hook
- 10-second polling interval (configurable)
- Cleanup on unmount

### 3. Memory Management

- Proper cleanup in useEffect
- Video element cleanup
- Interval cleanup

### 4. Bundle Size

- Tree-shaking friendly exports
- Minimal dependencies
- Lazy loading opportunities

## Extension Points

### 1. Adding Features

```typescript
// Easy to add new props to components
interface StudentCardProps {
  student: InvigilatingStudent;
  onClick: () => void;
  // New features:
  onReport?: (studentId: number) => void;
  showDetails?: boolean;
}
```

### 2. Custom Hooks

```typescript
// Easy to create specialized hooks
const useStudentMonitoring = (studentId: number) => {
  // Monitor specific student
};

const useInvigilationStats = (testId: string) => {
  // Get statistics
};
```

### 3. WebRTC Integration

```typescript
// Use provided utilities
import { createPeerConnection, handleRemoteStream } from "@/utils/webrtc";

// In StudentLivestreamModal
const peerConnection = createPeerConnection();
handleRemoteStream(peerConnection, videoRef.current);
```

## Testing Strategy

### Unit Tests

- StudentCard rendering
- StudentGrid layout
- Hook functionality
- Utility functions

### Integration Tests

- Page navigation
- API integration
- Modal interactions
- Auto-refresh

### E2E Tests

- Complete user flow
- Multiple students
- Error scenarios
- Responsive design

## Accessibility

### ARIA Labels

```typescript
// Example in StudentCard
<div
  role="button"
  aria-label={`View ${student.name}'s livestream`}
  tabIndex={0}
  onClick={onClick}
>
```

### Keyboard Navigation

- Tab through cards
- Enter to open modal
- Escape to close modal
- Focus management

### Screen Reader Support

- Semantic HTML
- Descriptive labels
- Status announcements

## Browser Compatibility

### Supported Browsers

- Chrome 56+ (WebRTC support)
- Firefox 52+ (WebRTC support)
- Safari 11+ (WebRTC support)
- Edge 79+ (WebRTC support)

### Polyfills Needed

- None (using modern React/Next.js)

### Progressive Enhancement

- Works without WebRTC (shows placeholder)
- Graceful degradation for older browsers

---

This architecture provides a solid foundation for the invigilation feature with clear separation of concerns, type safety, and extensibility.
