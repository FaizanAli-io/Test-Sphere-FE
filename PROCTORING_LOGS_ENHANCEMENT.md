# Proctoring Logs Enhancement - Screenshot & Webcam Filtering

## Overview

Enhanced the existing Proctoring Logs Modal to allow teachers to filter and view screenshots and webcam photos separately, with improved UI and better organization.

## Features Implemented

### 1. **Filter Buttons**

Three filter options with live counts:

- **All** - Shows all proctoring logs (screenshots + webcam photos)
- **Screenshots** - Shows only screen captures
- **Webcam Photos** - Shows only webcam captures

### 2. **Visual Indicators**

Each image card displays:

- **Type Badge** - Blue badge for screenshots, green badge for webcam photos
- **Icon** - Monitor icon for screenshots, camera icon for webcam photos
- **Timestamp** - Time and date when the image was captured
- **Hover Effects** - Scale animation and border highlight on hover

### 3. **Improved UI**

- **Larger Modal** - Increased from max-w-3xl to max-w-5xl for better viewing
- **Better Grid** - Responsive grid (2-5 columns based on screen size)
- **Enhanced Header** - Gradient background matching existing theme
- **Better Loading States** - Improved loading, error, and empty states
- **Full-Screen Image View** - Click any image to view in full size

### 4. **Performance Optimizations**

- **useMemo** for filtered logs - Prevents unnecessary recalculations
- **useMemo** for log counts - Efficient counting of log types
- **Sorted by Time** - All logs sorted chronologically

## Technical Implementation

### Component Structure

```
ProctoringLogsModal
├── Header (with close button)
├── Filter Buttons (All, Screenshots, Webcam Photos)
├── Content Area
│   ├── Loading State
│   ├── Error State
│   ├── Empty State
│   └── Image Grid
│       └── Image Cards (with badges and timestamps)
└── Full-Screen Image Modal
```

### State Management

```typescript
const [logs, setLogs] = useState<ProctoringLog[] | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [selectedImage, setSelectedImage] = useState<string | null>(null);
const [filterType, setFilterType] = useState<FilterType>("ALL");
```

### Data Flow

```
Backend API
    ↓
Fetch logs with logType (SCREENSHOT | WEBCAM_PHOTO)
    ↓
Filter based on selected type
    ↓
Sort by timestamp
    ↓
Display in grid with badges
```

## UI Design

### Color Scheme

- **All Filter**: Yellow (matches existing theme)
- **Screenshots**: Blue
- **Webcam Photos**: Green
- **Hover State**: Yellow border

### Responsive Grid

- **Mobile (< 640px)**: 2 columns
- **Small (640px+)**: 3 columns
- **Medium (768px+)**: 4 columns
- **Large (1024px+)**: 5 columns

### Typography

- **Header**: text-xl font-bold
- **Filter Buttons**: font-medium
- **Timestamps**: text-xs
- **Empty States**: text-lg

## Usage

### For Teachers

1. **Open Proctoring Logs**
   - Navigate to test submissions
   - Click "View Logs" button for any submission

2. **Filter Logs**
   - Click "All" to see all logs
   - Click "Screenshots" to see only screen captures
   - Click "Webcam Photos" to see only webcam captures
   - Badge counts show how many of each type exist

3. **View Images**
   - Each card shows a thumbnail with type badge
   - Timestamp displayed below each image
   - Click any image to view full size
   - Click outside or X button to close full-size view

4. **Identify Image Types**
   - Blue badge with monitor icon = Screenshot
   - Green badge with camera icon = Webcam photo

## Code Changes

### Modified Files

- `Test-Sphere-FE/src/components/TestDetail/modals/ProctoringLogsModal.tsx`

### Key Changes

#### 1. Added Imports

```typescript
import { Camera, Monitor } from "lucide-react";
import { useMemo } from "react";
```

#### 2. Added Filter State

```typescript
const [filterType, setFilterType] = useState<FilterType>("ALL");
```

#### 3. Added Filtering Logic

```typescript
const filteredLogs = useMemo(() => {
  if (!logs) return [];

  const filtered =
    filterType === "ALL"
      ? logs
      : logs.filter((log) => log.logType === filterType);

  const allMeta = filtered.flatMap((log) =>
    log.meta.map((meta) => ({
      ...meta,
      logId: log.id,
      logType: log.logType,
    }))
  );

  return allMeta.sort(
    (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
  );
}, [logs, filterType]);
```

#### 4. Added Count Logic

```typescript
const logCounts = useMemo(() => {
  if (!logs) return { screenshot: 0, webcam: 0, total: 0 };

  const counts = logs.reduce(
    (acc, log) => {
      const metaCount = log.meta.length;
      if (log.logType === "SCREENSHOT") {
        acc.screenshot += metaCount;
      } else if (log.logType === "WEBCAM_PHOTO") {
        acc.webcam += metaCount;
      }
      acc.total += metaCount;
      return acc;
    },
    { screenshot: 0, webcam: 0, total: 0 }
  );

  return counts;
}, [logs]);
```

#### 5. Enhanced UI Components

- Filter buttons with icons and counts
- Image cards with type badges
- Improved timestamps
- Better empty states

## Backend Integration

### Expected API Response

```json
[
  {
    "id": 1,
    "submissionId": 123,
    "logType": "SCREENSHOT",
    "timestamp": "2024-01-01T10:00:00Z",
    "meta": [
      {
        "image": "https://...",
        "takenAt": "2024-01-01T10:00:00Z"
      }
    ]
  },
  {
    "id": 2,
    "submissionId": 123,
    "logType": "WEBCAM_PHOTO",
    "timestamp": "2024-01-01T10:01:00Z",
    "meta": [
      {
        "image": "https://...",
        "takenAt": "2024-01-01T10:01:00Z"
      }
    ]
  }
]
```

### Log Types (from Prisma Schema)

```prisma
enum LogType {
  SCREENSHOT
  WEBCAM_PHOTO
  SYSTEM_EVENT
}
```

## Testing Checklist

- [x] Filter buttons display correctly
- [x] "All" filter shows all logs
- [x] "Screenshots" filter shows only screenshots
- [x] "Webcam Photos" filter shows only webcam photos
- [x] Badge counts are accurate
- [x] Type badges display on each card
- [x] Icons display correctly (Monitor/Camera)
- [x] Timestamps format correctly
- [x] Images load properly
- [x] Full-size view works
- [x] Hover effects work
- [x] Responsive grid works on all screen sizes
- [x] Loading state displays
- [x] Error state displays
- [x] Empty states display
- [x] No TypeScript errors
- [x] Blends with existing styling

## Performance Considerations

### Optimizations

1. **useMemo** for filtered logs - Only recalculates when logs or filter changes
2. **useMemo** for counts - Only recalculates when logs change
3. **Lazy loading** - Images load as needed
4. **Efficient sorting** - Single sort operation per filter change

### Memory Management

- Proper cleanup on modal close
- Image optimization with Next.js Image component
- Efficient state updates

## Accessibility

- **Keyboard Navigation**: Tab through filter buttons
- **ARIA Labels**: Close buttons have aria-label
- **Alt Text**: All images have descriptive alt text
- **Focus Management**: Modal traps focus when open
- **Color Contrast**: All text meets WCAG standards

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

### Potential Additions

1. **Download Images** - Allow teachers to download individual or all images
2. **Zoom Controls** - Add zoom in/out for full-size view
3. **Slideshow Mode** - Navigate through images with arrow keys
4. **Export Report** - Generate PDF report with all logs
5. **Flagging System** - Allow teachers to flag suspicious images
6. **Comparison View** - View screenshot and webcam photo side-by-side
7. **Time Range Filter** - Filter by specific time ranges
8. **Search** - Search by timestamp or other metadata

## Troubleshooting

### Images Not Loading

- Check image URLs are valid
- Verify CORS settings
- Check network tab for errors

### Filter Not Working

- Verify logType is correctly set in backend
- Check console for errors
- Ensure logs array is properly formatted

### Counts Incorrect

- Verify meta array structure
- Check logType values match enum
- Ensure all logs have meta array

## Summary

✅ **Professional Implementation**

- Clean, modular code
- No code duplication
- Follows existing patterns

✅ **Enhanced UI**

- Blends with existing styling
- Intuitive filter buttons
- Clear visual indicators

✅ **Performance Optimized**

- Efficient filtering and sorting
- Memoized calculations
- Lazy image loading

✅ **Fully Functional**

- All requirements met
- No conflicts with existing code
- Production-ready

The proctoring logs modal now provides teachers with a powerful, intuitive interface to review student activity during tests, with clear separation between screenshots and webcam photos.
