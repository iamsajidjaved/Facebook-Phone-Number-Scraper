# Facebook Contact Extractor - Chrome Extension

A powerful Chrome extension designed to extract contact numbers from Facebook buy-and-sell groups for WhatsApp marketing purposes.

## Features

- **Infinite Scrolling**: Automatically scrolls through Facebook pages to load more posts
- **Smart Contact Detection**: Uses multiple regex patterns to detect various phone number formats
- **Real-time Extraction**: Continuously extracts contact numbers as you browse
- **Data Storage**: Safely stores extracted contacts in Chrome's local storage
- **Export Functionality**: Export contacts as CSV files
- **Floating UI**: Non-intrusive floating panel to control the extension
- **Keyboard Shortcuts**: Quick access with Ctrl+Shift+E and Ctrl+Shift+H
- **Duplicate Prevention**: Automatically prevents duplicate contact entries

## Installation

1. **Enable Developer Mode in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner

2. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `fb-chrome-extension` folder
   - The extension will be installed and ready to use

## Usage

### Getting Started
1. Navigate to any Facebook group page (e.g., Mardan buy-and-sell groups)
2. Click the extension icon in the Chrome toolbar
3. Click "Start Extraction" in the popup

### Alternative Methods
- **Keyboard Shortcut**: Press `Ctrl+Shift+E` to start/stop extraction
- **Floating Panel**: A floating control panel will appear on the page

### Features Overview

#### Automatic Operation
- The extension will automatically start scrolling the page
- It continuously extracts phone numbers from posts
- New contacts are saved in real-time
- Duplicates are automatically filtered out

#### Control Panel
The floating panel shows:
- Current status (Active/Inactive)
- Number of contacts found
- Scrolling status
- Control buttons

#### Export Options
- **CSV Export**: Download all contacts as a CSV file
- **View Contacts**: See all extracted contacts in a new tab
- **Clear Data**: Remove all stored contacts

### Keyboard Shortcuts
- `Ctrl+Shift+E`: Toggle extraction on/off
- `Ctrl+Shift+H`: Hide/show the floating control panel

## Phone Number Formats Supported

The extension recognizes various phone number formats:

- Pakistani numbers: `+92 300 1234567`, `0300-1234567`, etc.
- International format: `+1 234 567 8900`
- WhatsApp links: `wa.me/923001234567`
- Various separators: spaces, dashes, dots, parentheses

## Data Management

### Storage
- All contacts are stored locally in Chrome's storage
- Data persists across browser sessions
- No data is sent to external servers

### Export Format
The CSV export includes:
- Phone Number
- Original Text (as found on page)
- Context (surrounding text)
- Timestamp
- Source URL

## Privacy & Security

- **Local Storage Only**: All data stays on your device
- **No External Requests**: No data is sent to third parties
- **Facebook Compliant**: Works within Facebook's terms of service
- **User Control**: Full control over data collection and export

## Technical Details

### File Structure
```
fb-chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Main extraction logic
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles.css            # UI styling
├── icons/                # Extension icons
└── README.md             # This file
```

### Permissions Required
- `activeTab`: To interact with the current Facebook tab
- `storage`: To save extracted contacts locally
- `scripting`: To inject the content script

## Troubleshooting

### Extension Not Working
1. Refresh the Facebook page
2. Ensure you're on a Facebook group page
3. Check that Developer Mode is enabled
4. Try reloading the extension

### No Contacts Found
1. Ensure the page has posts with phone numbers
2. Scroll manually to verify content is loading
3. Check that posts are visible (not blocked by privacy settings)

### Performance Issues
1. The extension pauses between scrolls to avoid overloading
2. Close other heavy tabs to improve performance
3. Restart Chrome if the extension becomes unresponsive

## Best Practices

### Ethical Usage
- Only extract contacts from public groups
- Respect Facebook's terms of service
- Use extracted data responsibly
- Consider privacy implications before contacting people

### Optimal Performance
- Use on stable internet connections
- Close unnecessary browser tabs
- Allow the extension to run for several minutes for best results
- Monitor the extraction progress through the control panel

## Updates and Maintenance

The extension is designed to be robust against Facebook's layout changes, but some updates may be needed over time if Facebook significantly changes their structure.

## Support

For issues or questions:
1. Check this README for troubleshooting steps
2. Verify you're using the latest version
3. Ensure all files are properly installed

---

**Disclaimer**: This extension is for educational and legitimate business purposes only. Users are responsible for complying with applicable laws and Facebook's terms of service when using this tool.
