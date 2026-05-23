# Skip Dismiss Extension

A Chrome extension that automatically finds and clicks skip/dismiss buttons on websites, with special optimization for YouTube ads.

## Version 2.0 Improvements

- **Added delays**: Initial 500ms delay before first click attempt, 300ms between click attempts
- **Multiple click attempts**: Up to 5 attempts per button with different click methods
- **Retry logic**: Up to 3 retry cycles with 1 second delay between cycles
- **Enhanced visibility checks**: Better detection of visible and enabled elements
- **Multiple click methods**: Tries standard click, MouseEvent, and Event dispatching
- **Periodic checks**: Runs every 5 seconds to catch any missed buttons
- **MutationObserver**: Watches for DOM changes and reacts to new elements

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Navigate to the extension folder and select it

## Usage

### Automatic Mode
The extension runs automatically when you visit any website. It will:
- Wait 500ms after page load
- Search for skip/dismiss buttons
- Click them with delays and retries
- Watch for new buttons appearing (ads, popups, etc.)
- Check periodically every 5 seconds

### Manual Mode
Click the extension icon in the toolbar to manually trigger the skip logic. This is useful for testing or when automatic mode misses something.

## Configuration

You can modify the configuration in `content.js`:

```javascript
const CONFIG = {
  initialDelay: 500,        // Initial delay before first click attempt (ms)
  clickDelay: 300,           // Delay between click attempts (ms)
  maxAttempts: 5,            // Maximum click attempts per button
  retryDelay: 1000,          // Delay between retry cycles (ms)
  maxRetries: 3,             // Maximum retry cycles
  observerEnabled: true      // Enable MutationObserver for dynamic content
};
```

## How It Works

1. **YouTube Optimization**: Uses specific CSS selectors for YouTube's ad skip buttons
2. **Generic Detection**: Falls back to searching for buttons with skip/dismiss keywords
3. **Visibility Checks**: Only clicks elements that are visible and enabled
4. **Multiple Click Methods**: Tries different click methods to bypass anti-automation
5. **Retry Logic**: Retries failed clicks multiple times
6. **Dynamic Content**: Watches for DOM changes to catch new buttons

## Debugging

Open the browser console (F12) to see detailed logs:
- "Skip Dismiss: Extension loaded" - Extension initialized
- "Skip Dismiss: Searching for skip buttons..." - Actively searching
- "Skip Dismiss: Found YouTube element" - Found a YouTube skip button
- "Skip Dismiss: Attempting click X/Y" - Clicking with retry logic
- "Skip Dismiss: Click successful" - Click worked

## Troubleshooting

### Extension not working on YouTube
1. Make sure Developer Mode is enabled
2. Reload the extension after making changes
3. Check the console for errors
4. Try clicking the extension icon manually

### Clicks not registering
1. Increase the delays in CONFIG
2. Check if YouTube has changed their button classes
3. Look at the console to see which selectors are being tried

### Too many clicks
1. Reduce maxAttempts in CONFIG
2. Reduce maxRetries in CONFIG
3. Disable observerEnabled if you don't need dynamic detection

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main logic for finding and clicking buttons
- `background.js` - Service worker for manual trigger
- `README.md` - This file

## License

MIT License - Feel free to modify and use as needed.
