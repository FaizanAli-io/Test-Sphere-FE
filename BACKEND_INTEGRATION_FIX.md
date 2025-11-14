# Backend Integration Fix

## Issue

The frontend was expecting a different response format from the backend `/tests/{testId}/invigilate` endpoint, causing a `students.map is not a function` error.

## Root Cause

The backend returns:

```json
{
  "submissions": [
    {
      "id": 123,
      "userId": 1,
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "profileImage": "https://..."
      },
      "status": "IN_PROGRESS",
      ...
    }
  ]
}
```

But the frontend was expecting a direct array of students.

## Solution

Updated `src/hooks/useInvigilateStudents.ts` to:

1. Extract the `submissions` array from the response
2. Transform each submission to the `InvigilatingStudent` interface
3. Map the data correctly:
   - `submission.user.id` → `student.id`
   - `submission.user.name` → `student.name`
   - `submission.user.email` → `student.email`
   - `submission.user.profileImage` → `student.profilePicture`
   - `submission.id` → `student.submissionId`

## Code Changes

### Before

```typescript
const data = await response.json();
setStudents(data); // Expected data to be an array
```

### After

```typescript
const data = await response.json();

// Backend returns: { submissions: [{ id, userId, user: {...}, ... }] }
if (data && Array.isArray(data.submissions)) {
  const students = data.submissions.map((submission: any) => ({
    id: submission.user.id,
    name: submission.user.name,
    email: submission.user.email,
    profilePicture: submission.user.profileImage,
    cameraEnabled: true, // TODO: Get from WebRTC or proctoring data
    microphoneEnabled: true, // TODO: Get from WebRTC or proctoring data
    submissionId: submission.id,
  }));
  setStudents(students);
} else {
  console.warn("No submissions found in response:", data);
  setStudents([]);
}
```

## Backend Endpoint Details

### Controller

```typescript
// test.controller.ts
@Get(':testId/invigilate')
@Roles(UserRole.TEACHER)
async getStudentsByTest(
  @Param('testId', ParseIntPipe) testId: number,
  @GetUser('id') userId: number,
) {
  return this.testService.getStudentsByTestId(testId, userId);
}
```

### Service

```typescript
// test.service.ts
async getStudentsByTestId(testId: number, userId: number) {
  await this.ensureTeacherOwnsTest(userId, testId);

  const test = await this.prisma.test.findUnique({
    where: { id: testId },
    select: {
      submissions: {
        include: { user: true },
        where: { status: SubmissionStatus.IN_PROGRESS },
      },
    },
  });

  return test;
}
```

## Data Flow

```
Backend (Prisma)
    ↓
{ submissions: [{ id, user: {...}, status: "IN_PROGRESS" }] }
    ↓
Frontend Hook (Transform)
    ↓
[{ id, name, email, profilePicture, submissionId, ... }]
    ↓
StudentGrid Component
    ↓
StudentCard Components
```

## Testing

1. Start the backend: `cd Test-Sphere-BE && npm run start:dev`
2. Start the frontend: `cd Test-Sphere-FE && npm run dev`
3. Navigate to: `http://localhost:3000/test/[testId]/invigilate`
4. Check browser console for: `"Invigilation API response:"` log
5. Verify students appear in the grid

## Future Enhancements

### Camera/Microphone Status

Currently hardcoded to `true`. To implement:

1. Add WebRTC connection tracking
2. Store device status in proctoring logs
3. Query device status from backend
4. Update the transformation logic

### Example Implementation

```typescript
// In the future, backend could return:
{
  submissions: [
    {
      id: 123,
      user: {...},
      deviceStatus: {
        cameraEnabled: true,
        microphoneEnabled: false
      }
    }
  ]
}

// Then frontend would use:
cameraEnabled: submission.deviceStatus?.cameraEnabled ?? true,
microphoneEnabled: submission.deviceStatus?.microphoneEnabled ?? true,
```

## Status

✅ **Fixed** - The integration now works correctly with the actual backend response format.
