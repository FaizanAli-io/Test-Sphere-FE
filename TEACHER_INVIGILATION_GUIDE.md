# Teacher Invigilation Guide

## Quick Start

### Accessing the Invigilation Interface

1. Navigate to your test detail page: `http://localhost:3000/test/[testId]`
2. Click the **"📹 Invigilate"** button in the header
3. You'll be taken to the invigilation page where you can monitor all students

### Understanding the Interface

#### Main Grid View

- **Student Cards**: Each card represents one student currently taking the test
- **Live Indicator**: Red "LIVE" badge shows the student is actively taking the test
- **Profile Picture**: Shows the student's photo or their initials
- **Device Status**:
  - 🎥 Green camera icon = Camera is enabled
  - 🎥 Gray camera icon = Camera is disabled
  - 🎤 Green microphone icon = Microphone is enabled
  - 🎤 Gray microphone icon = Microphone is disabled

#### Monitoring Students

1. **View All Students**: The grid automatically updates every 10 seconds
2. **Manual Refresh**: Click the "Refresh" button in the top-right corner
3. **Click Any Card**: Opens the livestream modal for that student

#### Livestream Modal

When you click on a student card:

- **Video Player**: Shows the student's live video feed (when WebRTC is implemented)
- **Student Info**: Displays name, email, and submission ID
- **Device Status**: Shows current camera and microphone status
- **Close**: Click the X button or click outside the modal to close

### Features

✅ **Real-time Updates**: Student list refreshes automatically every 10 seconds
✅ **Responsive Design**: Works on desktop, tablet, and mobile devices
✅ **Device Monitoring**: See which students have camera/mic enabled
✅ **Easy Navigation**: One-click access to individual student streams
✅ **Clean Interface**: Dark theme optimized for extended monitoring sessions

### Tips for Effective Invigilation

1. **Keep the page open**: The interface will automatically update with new students
2. **Monitor device status**: Check that students have their cameras enabled
3. **Click to investigate**: If you notice anything unusual, click the student card for a closer look
4. **Use multiple monitors**: Open multiple student streams on different screens if needed

### Keyboard Shortcuts

- **Escape**: Close the livestream modal
- **Click outside modal**: Close the livestream modal

### Troubleshooting

**No students showing up?**

- Ensure students have started the test
- Check that the test is currently active
- Click the refresh button to manually update

**Can't see video stream?**

- WebRTC implementation is in progress
- You'll see a "Connecting to livestream..." message
- Contact your administrator for WebRTC setup status

**Grid layout looks wrong?**

- Try refreshing the page
- Check your browser zoom level (should be 100%)
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)

### Browser Requirements

- Chrome 56 or later
- Firefox 52 or later
- Safari 11 or later
- Edge 79 or later

### Privacy & Security

- All video streams are encrypted
- Only teachers can access the invigilation interface
- Students are notified when being monitored
- No recordings are stored without explicit permission

### Need Help?

If you encounter any issues:

1. Refresh the page
2. Check your internet connection
3. Try a different browser
4. Contact technical support

---

**Note**: The WebRTC livestream feature is currently in development. The interface is fully functional and ready to display live video feeds once the backend signaling server is configured.
