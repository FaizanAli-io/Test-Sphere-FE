# Test Sphere — Frontend Instructions

> Next.js 15 (App Router) frontend for an AI-powered exam management platform.

---

## Tech Stack

| Layer     | Technology                                                 |
| --------- | ---------------------------------------------------------- |
| Framework | Next.js 15.5 (React 19, App Router, Turbopack)             |
| Language  | TypeScript 5 (strict mode)                                 |
| Styling   | Tailwind CSS 4                                             |
| Auth      | JWT (localStorage) + Firebase Google OAuth                 |
| Real-time | Socket.io client + WebRTC                                  |
| Upload    | ImageKit (imagekitio-react)                                |
| AI Chat   | Streaming NDJSON (react-markdown + rehype-highlight)       |
| Icons     | lucide-react                                               |
| Linting   | ESLint (next/core-web-vitals + next/typescript) + Prettier |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — providers, AuthGuard, Header
│   ├── page.tsx                # Landing / auth page
│   ├── globals.css             # Tailwind + custom animations + CSS variables
│   └── (routes)/               # Route group (no URL prefix)
│       ├── student/page.tsx        # /student
│       ├── teacher/page.tsx        # /teacher
│       ├── prepguru/page.tsx       # /prepguru (dynamic import, SSR: false)
│       ├── class/[classId]/page.tsx        # /class/:classId
│       ├── test/[testId]/page.tsx          # /test/:testId
│       ├── test/[testId]/invigilate/page.tsx  # /test/:testId/invigilate
│       └── give-test/[testId]/page.tsx     # /give-test/:testId
├── components/
│   ├── AuthGuard.tsx           # Route protection (role-based redirects)
│   ├── Header.tsx              # Sticky nav (logo, PrepGuru link, profile, logout)
│   ├── ConfirmationModal.tsx   # Reusable confirm dialog (danger/warning/info)
│   ├── NotificationBar.tsx     # Toast notifications (auto-dismiss 5s)
│   ├── ProfileImageUpload.tsx  # ImageKit upload with preview
│   ├── ProfileModal.tsx        # Portal-based profile edit modal
│   ├── Auth/                   # Login, Signup, OTP, ForgotPassword, GoogleSignIn
│   ├── SharedPortal/           # BasePortal, BaseClassCard, BaseQuickActionCard
│   ├── StudentPortal/          # Student dashboard + modals
│   ├── TeacherPortal/          # Teacher dashboard + modals
│   ├── ClassDetail/            # Class management (teachers, students, tests)
│   ├── TestDetail/             # Test CRUD, questions, pools, submissions, AI generation
│   ├── GiveTest/               # Test-taking UI with proctoring
│   ├── Invigilate/             # Teacher proctoring dashboard (WebRTC grid)
│   ├── PrepGuru/               # AI chatbot interface
│   ├── Submissions/            # Submission list + detail views
│   ├── CreateTestModal/        # Test creation modal
│   └── Common/                 # Shared components (ProctoringLogs, etc.)
├── contexts/
│   └── NotificationContext.tsx # Global notification provider
├── hooks/
│   ├── useApi.ts               # Fetch wrapper (auth, logging, deduplication)
│   ├── useConfirmation.ts      # Promise-based confirmation modal
│   ├── useConnectionMonitor.ts # Health check polling (10s / exponential backoff)
│   ├── useImageKitUploader.ts  # ImageKit auth + upload management
│   ├── useNotification.ts      # Toast notification state
│   ├── useOfflineQueueManager.ts  # IndexedDB sync for offline proctoring logs
│   ├── useProfileEditor.ts     # Profile form state + save
│   └── useWebRTC.ts            # Socket.io + peer connections
└── utils/
    ├── encryption.ts           # AES-GCM encryption (PBKDF2 key derivation)
    ├── error.ts                # extractErrorMessage() utility
    ├── firebase.ts             # Firebase app + Google auth provider
    ├── logger.ts               # Conditional debug logger
    ├── offlineStorage.ts       # IndexedDB wrapper for offline logs
    ├── rolePermissions.ts      # canEdit/canDelete/canManageMembers/canView
    ├── timezone.ts             # Local ↔ UTC datetime conversion
    └── webrtc.ts               # WebRTC peer connection helpers
```

---

## Commands

```bash
npm run dev         # Dev server with Turbopack
npm run build       # Production build with Turbopack
npm start           # Production server
npm run lint        # ESLint
npm run format      # Prettier formatting
```

---

## Environment Variables

```env
NEXT_PUBLIC_DEV_MODE=true               # "true" → localhost:5000, "false" → production backend
NEXT_PUBLIC_ENCRYPTION_SALT=<salt>      # PBKDF2 encryption key salt
NEXT_PUBLIC_LOGGING=true                # "true" → enable debug console logs
```

API base URL is determined by `NEXT_PUBLIC_DEV_MODE`:

- `true` → `http://localhost:5000`
- `false` → `https://backend.projectvault.pk`

---

## Architecture Patterns

### Provider Stack (root layout)

```
<NotificationProvider>
  <AuthGuard>
    <Header />
    <main>{children}</main>
  </AuthGuard>
</NotificationProvider>
```

### Route Groups

All pages live under `(routes)/` — a Next.js route group that doesn't affect the URL path. Every page component is `"use client"` and renders its corresponding feature component.

### Component/Server Boundary

- **Server component**: `layout.tsx` (root layout only)
- **Client components**: All page components and feature components use `"use client"`
- **Dynamic imports**: Heavy components like PrepGuru use `next/dynamic` with `ssr: false`

### Feature Folder Pattern

Each major feature (StudentPortal, TeacherPortal, TestDetail, etc.) has:

```
ComponentName/
├── ComponentName.tsx       # Main component
├── index.tsx               # Re-export barrel
├── hooks/                  # Feature-specific hooks
├── components/             # Sub-components
└── modals/                 # Feature modals
```

---

## Authentication Flow

### Email/Password

1. **Signup** → POST `/auth/signup` → OTP sent → verify → account active
2. **Login** → POST `/auth/login` → JWT returned → stored in `localStorage.token`
3. **Password Reset** → request OTP → verify → set new password

### Google OAuth

- Firebase `signInWithPopup` with `GoogleAuthProvider`
- On success → POST `/auth/login` with Firebase ID → JWT returned

### Token Storage

- `localStorage.token` — JWT auth token
- `localStorage.role` — `"STUDENT"` or `"TEACHER"`
- `localStorage.userEmail` — user email

### Cross-Tab Sync

- `storage` event listener for token changes
- Custom `authChange` event dispatched on login/logout

### Route Protection (AuthGuard)

| Route Pattern                     | Access                   |
| --------------------------------- | ------------------------ |
| `/`, `/login`, `/signup`          | Public                   |
| `/student`, `/give-test/*`        | STUDENT only             |
| `/teacher`, `/class/*`, `/test/*` | TEACHER only             |
| `/prepguru`                       | Authenticated (any role) |

---

## API Integration

### useApi Hook

Central fetch wrapper at `src/hooks/useApi.ts`:

```typescript
const api = useApi();
const res = await api("/tests/123", { auth: true });
```

**Features**:

- Auto-prepends API base URL
- `auth: true` → Bearer token from localStorage
- `date: true` → appends `requestDate` timestamp
- `stream: true` → skip caching/logging
- Request deduplication (100ms window for identical GET requests)
- Request/response logging when `NEXT_PUBLIC_LOGGING=true`
- Automatic `Content-Type: application/json` (skipped for FormData)

### Error Handling

```typescript
import { extractErrorMessage } from "@/utils/error";

const res = await api("/endpoint", { auth: true });
if (!res.ok) {
  const msg = extractErrorMessage(await res.json());
  showError(msg);
}
```

---

## State Management

### Context

- **NotificationContext** — global toast notifications (`showSuccess`, `showError`, `showWarning`, `showInfo`)

### Custom Hooks (data fetching)

Each feature has dedicated hooks that encapsulate API calls and state:

- `useStudentClasses` / `useTeacherPortal` — portal data
- `useClassDetails` — single class with members
- `useTestDetail` / `useQuestions` / `useQuestionPools` — test management
- `useSubmissions` — submission list + details
- `useTestExam` — test-taking state, timer, answers
- `useAgentStream` — streaming LLM responses

### Offline Storage

- **IndexedDB** (`ProctoringLogsDB`) stores encrypted proctoring logs when offline
- `useOfflineQueueManager` syncs logs to backend when connection restores
- Logs encrypted with AES-GCM (key derived from submissionId + salt via PBKDF2)

---

## Styling

### Tailwind CSS 4

- Utility-first, responsive (mobile-first breakpoints)
- Common palette: indigo/purple gradients for primary, red/green/yellow for status
- PostCSS via `@tailwindcss/postcss` plugin

### Custom CSS (globals.css)

- CSS variables for dark/light mode support
- Custom animations: `fadeIn`, `slideInRight`, `pulse`, `shake`, `slideIn`
- highlight.js GitHub theme for code blocks

### Patterns

- Gradient backgrounds on cards and headers
- Shadow elevation on hover
- Portal-based modals with dark overlay + blur
- Responsive grids (1 col mobile → 2+ cols desktop)

---

## Coding Conventions

### Naming

| Element             | Convention                  | Example                                    |
| ------------------- | --------------------------- | ------------------------------------------ |
| Component files     | PascalCase                  | `StudentPortal.tsx`, `AuthGuard.tsx`       |
| Hook files          | camelCase with `use` prefix | `useApi.ts`, `useWebRTC.ts`                |
| Util files          | camelCase                   | `encryption.ts`, `rolePermissions.ts`      |
| Components          | PascalCase                  | `<TestDetail />`, `<BaseClassCard />`      |
| Hooks               | camelCase with `use` prefix | `useApi()`, `useTestExam()`                |
| Callbacks (props)   | `on` prefix                 | `onConfirm`, `onCancel`, `onChange`        |
| Handlers (internal) | `handle` prefix             | `handleSubmit`, `handleDelete`             |
| Booleans            | `is`/`show`/`has` prefix    | `isLoading`, `showModal`, `hasPendingLogs` |
| Constants           | UPPER_SNAKE_CASE            | `API_BASE_URL`, `DB_NAME`                  |
| Types/Interfaces    | PascalCase                  | `UserProfile`, `TestConfig`, `BaseClass`   |

### Component Patterns

- All components are functional with hooks (no class components)
- Props interfaces defined inline or co-located
- Composition over inheritance — combine multiple hooks per component
- Portal-based modals via `createPortal`

### TypeScript

- **Strict mode** enabled globally
- All props, state, and API responses are typed
- Generics used for reusable hooks (`decryptData<T>`, etc.)
- Union string types for enums: `"OWNER" | "EDITOR" | "VIEWER"`
- Path alias: `@/*` → `./src/*`

---

## Key Features

### Test Taking (GiveTest)

- Fullscreen enforcement with violation tracking
- Webcam photo capture at randomized 5–10s intervals
- System event monitoring (tab switches, clicks, keystrokes)
- Offline queue (IndexedDB + AES-GCM encryption) with auto-sync
- Connection monitoring with exponential backoff health checks
- Test timer with auto-submit on violation threshold

### Live Proctoring (Invigilate)

- Grid of live student streams via WebRTC
- Socket.io signaling (namespace: `/streaming`)
- Click student card for fullscreen view
- View proctoring logs per submission

### AI Assistant (PrepGuru)

- Streaming chat interface with LLM responses (NDJSON)
- Markdown rendering with syntax highlighting
- Copy responses, clear chat history

### Role-Based Permissions

```typescript
import { canEdit, canDelete, canManageMembers } from "@/utils/rolePermissions";

canEdit(role); // OWNER or EDITOR
canDelete(role); // OWNER only
canManageMembers(role); // OWNER only
canView(role); // all roles
```

---

## Remote Image Hosts (next.config.ts)

- `ik.imagekit.io` — ImageKit CDN
- `lh3.googleusercontent.com` — Google user avatars

## TypeScript Configuration

- **Target**: ES2017
- **Module**: ESNext (bundler resolution)
- **strict**: true
- **jsx**: preserve (Next.js compiles)
- **Path alias**: `@/*` → `./src/*`

## ESLint Configuration

- Extends: `next/core-web-vitals`, `next/typescript`
- Ignores: `node_modules`, `.next`, `out`, `build`
