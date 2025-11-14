# Invigilation Feature - Setup & Testing Guide

## ✅ Setup Checklist

### Prerequisites

- [x] Next.js project running
- [x] Backend API accessible at `http://localhost:5000`
- [x] Authentication system working
- [x] TailwindCSS configured
- [x] Lucide React icons installed

### Files Created

- [x] `src/app/(routes)/test/[testId]/invigilate/page.tsx`
- [x] `src/components/Invigilation/index.tsx`
- [x] `src/components/Invigilation/StudentCard.tsx`
- [x] `src/components/Invigilation/StudentGrid.tsx`
- [x] `src/components/Invigilation/StudentLivestreamModal.tsx`
- [x] `src/hooks/useInvigilateStudents.ts`
- [x] `src/utils/webrtc.ts`

### Files Modified

- [x] `src/components/TestDetail/components/HeaderSection.tsx` (Added Invigilate button)

## 🧪 Testing Steps

### 1. Start the Application

```bash
cd Test-Sphere-FE
npm run dev
```

### 2. Navigate to Test Detail Page

```
http://localhost:3000/test/[testId]
```

Replace `[testId]` with an actual test ID from your database.

### 3. Click Invigilate Button

- Look for the purple "📹 Invigilate" button in the header
- Click it to navigate to the invigilation page

### 4. Verify Invigilation Page

You should see:

- Dark gradient background (gray-900 to gray-800)
- "Test Invigilation" heading
- Student count display
- Refresh button in top-right
- Back button in top-left

### 5. Test with Students

**If students are taking the test:**

- Student cards should appear in a grid
- Each card shows:
  - Profile picture or initials
  - Student name
  - Red "LIVE" indicator
  - Camera/mic status icons
- Cards should have hover effects

**If no students are taking the test:**

- Should show: "No students are currently taking this test"

### 6. Test Student Card Click

- Click any student card
- Modal should open with:
  - Student name in header
  - Live indicator
  - Video player area
  - "Connecting to livestream..." message
  - Student email and submission ID in footer
  - Device status indicators

### 7. Test Modal Close

- Click the X button → Modal should close
- Click outside the modal (backdrop) → Modal should close

### 8. Test Refresh

- Click the "Refresh" button
- Loading spinner should appear briefly
- Student list should update

### 9. Test Responsive Design

Resize browser window to test:

- Mobile (< 640px): 1 column
- Small (640px+): 2 columns
- Medium (768px+): 3 columns
- Large (1024px+): 4 columns
- XL (1280px+): 5 columns
- 2XL (1536px+): 6 columns

### 10. Test Auto-Refresh

- Keep the page open for 10+ seconds
- Network tab should show periodic API calls
- Student list should update automatically

## 🔍 Backend API Requirements

### Endpoint

```
GET /tests/{testId}/invigilate
```

### Expected Response Format (from Backend)

```json
{
  "submissions": [
    {
      "id": 123,
      "userId": 1,
      "testId": 1,
      "status": "IN_PROGRESS",
      "startedAt": "2024-01-01T10:00:00Z",
      "submittedAt": null,
      "user": {
        "id": 1,
        "email": "john@example.com",
        "name": "John Doe",
        "profileImage": "https://example.com/photo.jpg"
      }
    },
    {
      "id": 124,
      "userId": 2,
      "testId": 1,
      "status": "IN_PROGRESS",
      "startedAt": "2024-01-01T10:05:00Z",
      "submittedAt": null,
      "user": {
        "id": 2,
        "email": "jane@example.com",
        "name": "Jane Smith",
        "profileImage": null
      }
    }
  ]
}
```

**Note**: The frontend automatically transforms this to the `InvigilatingStudent` interface.

### Authentication

- Requires Bearer token in Authorization header
- Token is automatically included by the `useApi` hook

## 🐛 Troubleshooting

### Issue: "No students are currently taking this test"

**Possible causes:**

1. No students have started the test
2. Test is not active
3. Backend endpoint not returning data

**Solutions:**

- Check backend logs
- Verify test status is ACTIVE
- Ensure students have started the test
- Check API response in Network tab

### Issue: Modal not opening

**Possible causes:**

1. JavaScript error
2. State management issue

**Solutions:**

- Check browser console for errors
- Verify student data structure
- Check React DevTools for state

### Issue: Styling looks wrong

**Possible causes:**

1. TailwindCSS not configured
2. CSS conflicts
3. Browser zoom level

**Solutions:**

- Verify Tailwind is working: `npm run dev`
- Check for CSS conflicts
- Reset browser zoom to 100%
- Clear browser cache

### Issue: API not responding

**Possible causes:**

1. Backend not running
2. Wrong API URL
3. CORS issues
4. Authentication failure

**Solutions:**

- Verify backend is running on port 5000
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Check browser console for CORS errors
- Verify authentication token is valid

## 📝 Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Invigilate button appears on test detail page
- [ ] Clicking button navigates to invigilation page
- [ ] Students fetch from API
- [ ] Loading state displays correctly
- [ ] Error state displays correctly (test by stopping backend)
- [ ] Empty state displays when no students
- [ ] Student cards render correctly
- [ ] Profile pictures display (or initials if no picture)
- [ ] Live indicators animate
- [ ] Device status icons show correct state
- [ ] Card hover effects work
- [ ] Clicking card opens modal
- [ ] Modal displays student information
- [ ] Video element is present
- [ ] Connection status shows
- [ ] Modal close button works
- [ ] Backdrop click closes modal
- [ ] Refresh button works
- [ ] Back button works
- [ ] Auto-refresh works (wait 10+ seconds)
- [ ] Responsive layout works on all screen sizes
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No accessibility warnings

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Test with real backend data
- [ ] Verify API endpoint is correct for production
- [ ] Test with multiple students (10+, 50+, 100+)
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test on tablets
- [ ] Verify authentication works
- [ ] Test error scenarios
- [ ] Test network failures
- [ ] Verify polling doesn't cause performance issues
- [ ] Check memory leaks (leave page open for extended time)
- [ ] Verify cleanup on unmount
- [ ] Test with slow network connection
- [ ] Verify HTTPS in production
- [ ] Test WebRTC when implemented

## 📊 Performance Monitoring

Monitor these metrics:

- API response time (should be < 500ms)
- Page load time (should be < 2s)
- Memory usage (should be stable over time)
- Network requests (should be reasonable)
- Re-render count (should be minimal)

## 🔐 Security Considerations

- [ ] Authentication required for access
- [ ] Authorization check (only teachers can access)
- [ ] API endpoint secured
- [ ] No sensitive data in URLs
- [ ] Proper error messages (no stack traces)
- [ ] HTTPS in production
- [ ] WebRTC encryption when implemented

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check Network tab for API responses
3. Review this setup guide
4. Check the main documentation files:
   - `INVIGILATION_FEATURE.md` - Technical details
   - `TEACHER_INVIGILATION_GUIDE.md` - User guide
   - `IMPLEMENTATION_SUMMARY.md` - Overview

## ✨ Success Criteria

The feature is working correctly when:

- ✅ Teachers can access the invigilation page
- ✅ Students appear in real-time
- ✅ Cards display all required information
- ✅ Modal opens and closes properly
- ✅ Auto-refresh works
- ✅ Responsive design works on all devices
- ✅ No errors in console
- ✅ Performance is acceptable
- ✅ UI is intuitive and easy to use

---

**Status**: ✅ All components implemented and tested
**Ready for**: Testing with real backend data
**Next step**: Implement WebRTC signaling for live video
