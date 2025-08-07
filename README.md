# Facebook Phone Number Scraper 📞

A powerful Chrome extension designed to automatically extract phone numbers from Facebook groups for WhatsApp marketing purposes. This tool is perfect for businesses looking to build their contact database from Facebook buy-and-sell groups and community pages.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)

## 🚀 Features

### 🔥 Core Functionality
- **Automatic Phone Number Detection** - Extracts phone numbers from Facebook posts in multiple international formats
- **Smart Content Expansion** - Automatically clicks "See more" links to reveal hidden phone numbers
- **Real-time Extraction** - Continuously monitors and extracts numbers as you scroll through Facebook
- **International Support** - Recognizes phone number patterns from 15+ countries including Pakistan, India, USA, UK, Germany, France, Australia, Japan, China, South Korea, Brazil, Russia, Turkey, UAE, and Saudi Arabia

### 🛡️ Advanced Security & Stealth
- **Human-like Behavior** - Mimics natural scrolling patterns and reading speeds
- **Anti-Detection Technology** - Advanced stealth mode to avoid Facebook's automation detection
- **Smart Navigation Protection** - Ultra-strict safety checks to prevent accidental navigation away from target pages
- **Extension Context Recovery** - Automatic recovery from extension reloads and connection issues

### 📊 Data Management
- **WhatsApp Format Export** - Exports contacts in WhatsApp-ready format (`number@c.us`)
- **Local Storage Backup** - Automatic backup to browser storage with sync recovery
- **Duplicate Prevention** - Intelligent deduplication to avoid saving duplicate contacts
- **Context Preservation** - Saves original post context with each extracted number

### ⚡ Performance & Reliability
- **Continuous Operation** - Runs 24/7 without interruption or suspicious pauses
- **Error Recovery** - Comprehensive error handling with automatic fallback modes
- **Memory Efficient** - Optimized for long-running extraction sessions
- **Real-time Statistics** - Live tracking of extraction progress and human behavior simulation

## 📋 Requirements

- Google Chrome Browser (Version 88+)
- Facebook account with access to target groups
- Chrome Extensions Developer Mode enabled (for installation)

## 🛠️ Installation

### Method 1: Developer Mode (Recommended)
1. **Download the Extension**
   ```bash
   git clone https://github.com/iamsajidjaved/Facebook-Phone-Number-Scraper.git
   cd Facebook-Phone-Number-Scraper
   ```

2. **Enable Developer Mode**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" toggle in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the downloaded extension folder
   - The extension will appear in your Chrome toolbar

### Method 2: Manual Installation
1. Download the repository as a ZIP file
2. Extract the ZIP to a permanent location
3. Follow steps 2-3 from Method 1

## 🎯 How to Use

### Quick Start Guide
1. **Navigate to Facebook Groups**
   - Go to any Facebook buy-and-sell group or community page
   - Make sure you're viewing the group's main feed

2. **Start the Extension**
   - Click the extension icon in Chrome toolbar
   - Press the "Start" button in the floating panel
   - The extension will begin automatic extraction

3. **Monitor Progress**
   - Watch the real-time counter showing found contacts
   - See extraction status and scrolling activity
   - View human behavior simulation statistics

4. **Export Contacts**
   - Click "Export TXT" to download WhatsApp-ready format
   - Use "View Contacts" to preview extracted numbers
   - "Clear All" to reset the contact database

### 🔧 Advanced Usage

#### Keyboard Shortcuts
- `Ctrl + Shift + E` - Toggle extension on/off
- `Ctrl + Shift + H` - Hide/show extraction panel
- `Ctrl + Shift + X` - Quick export contacts

#### Extraction Modes
- **Continuous Mode** - Runs indefinitely without pauses
- **Stealth Mode** - Mimics human browsing patterns
- **Smart Expansion** - Automatically expands "See more" content

#### Safety Features
- **Navigation Protection** - Prevents clicking on profile links, videos, or external URLs
- **Group Lock** - Automatically returns to original group if navigation occurs
- **Context Validation** - Ensures extraction only occurs on intended content

## 📱 Supported Phone Number Formats

The extension recognizes and extracts phone numbers in various international formats:

### Pakistani Numbers
- `03001234567` (Local format)
- `+923001234567` (International format)
- `92 300 1234567` (Spaced format)

### International Formats
- **India**: `+91XXXXXXXXXX`, `91XXXXXXXXXX`
- **USA/Canada**: `+1XXXXXXXXXX`, `(XXX) XXX-XXXX`
- **UK**: `+44XXXXXXXXX`, `07XXXXXXXXX`
- **Germany**: `+49XXXXXXXXXXX`
- **France**: `+33XXXXXXXXX`
- **Australia**: `+61XXXXXXXXX`
- **Japan**: `+81XXXXXXXXXX`
- **China**: `+86XXXXXXXXXXX`
- **South Korea**: `+82XXXXXXXXX`
- **Brazil**: `+55XXXXXXXXXXX`
- **Russia**: `+7XXXXXXXXXX`
- **Turkey**: `+90XXXXXXXXXX`
- **UAE**: `+971XXXXXXXX`
- **Saudi Arabia**: `+966XXXXXXXXX`

### WhatsApp Integration Patterns
- WhatsApp links: `wa.me/XXXXXXXXXXX`
- WhatsApp text: `WhatsApp: XXXXXXXXXXX`
- Contact keywords in multiple languages

## ⚙️ Configuration

### Extension Settings
The extension includes several configurable options:

```javascript
// Extraction intervals (automatically randomized)
const SCROLL_INTERVAL = 3000-12000; // Milliseconds between scrolls
const EXTRACTION_INTERVAL = 8000-15000; // Milliseconds between extractions
const EXPANSION_DELAY = 2000; // Wait time for "See more" expansions
```

### Customization Options
- **Scroll Speed**: Adjusts based on time of day for natural behavior
- **Reading Pauses**: Simulates human reading patterns
- **Click Timing**: Human-like delays between interactions

## 🔒 Privacy & Security

### Data Handling
- **Local Storage Only** - All extracted data stays in your browser
- **No External Transmission** - Data never leaves your device
- **User Control** - Complete control over data export and deletion

### Facebook Compliance
- **Stealth Operation** - Designed to appear as natural browsing
- **Rate Limiting** - Respects Facebook's usage patterns
- **Safe Navigation** - Prevents accidental policy violations

### Security Features
- **Extension Context Protection** - Handles browser extension reloads gracefully
- **Error Recovery** - Automatic recovery from network issues
- **Safe Element Detection** - Ultra-strict validation before any interaction

## 🐛 Troubleshooting

### Common Issues & Solutions

#### Extension Not Working
**Problem**: Extension appears inactive or unresponsive
**Solution**: 
1. Refresh the Facebook page
2. Check if you're in a Facebook group (not on homepage)
3. Restart the extension by toggling off/on

#### No Numbers Found
**Problem**: Extension runs but doesn't find phone numbers
**Solution**:
1. Scroll manually to load more posts
2. Ensure posts contain visible phone numbers
3. Wait for "See more" expansions to complete

#### Connection Errors
**Problem**: "Extension context invalidated" errors
**Solution**:
1. Click "Refresh for Full Sync" in the error notification
2. Reload the Facebook page
3. Restart Chrome browser if persistent

#### Export Issues
**Problem**: Cannot export or download contacts
**Solution**:
1. Check Chrome's download permissions
2. Ensure popup blocker is disabled for Facebook
3. Try using "View Contacts" first to verify data

### Debug Mode
Enable debug mode for detailed logging:
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Run: `extractor.testExtraction()` to test phone number patterns
4. Run: `extractor.testSeeMoreDetection()` to test content expansion

## 🤝 Contributing

We welcome contributions to improve the extension! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with detailed description

### Areas for Contribution
- **New Phone Number Patterns** - Add support for more countries
- **UI Improvements** - Enhance the user interface
- **Performance Optimization** - Improve extraction speed
- **Bug Fixes** - Fix reported issues
- **Documentation** - Improve guides and examples

### Coding Standards
- Use ES6+ JavaScript features
- Follow existing code style and commenting
- Test changes across different Facebook layouts
- Ensure compatibility with Manifest V3

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed  
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No warranty provided
- ❌ Authors not liable

## ⚠️ Legal Disclaimer

**Important**: This tool is designed for legitimate business purposes such as:
- Building contact lists for your own business
- Marketing to interested prospects in buy-and-sell groups
- Connecting with potential customers who have posted contact information publicly

### Responsible Use Guidelines
- **Respect Privacy**: Only extract publicly posted contact information
- **Follow Facebook Terms**: Use in compliance with Facebook's Terms of Service
- **Obtain Consent**: Get consent before adding contacts to marketing lists
- **No Spam**: Use extracted contacts responsibly and ethically
- **Local Laws**: Comply with your local data protection and marketing laws

### User Responsibility
Users are solely responsible for:
- Compliance with Facebook's Terms of Service
- Adherence to local privacy and marketing laws
- Ethical use of extracted contact information
- Obtaining necessary permissions for marketing communications

The developers of this extension are not responsible for any misuse or legal issues arising from the use of this tool.

## 📞 Support

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Email Support**: [contact@example.com](mailto:contact@example.com)
- **Documentation**: Check this README and code comments

### FAQ

**Q: Is this extension safe to use?**
A: Yes, the extension includes advanced stealth features and safety checks to operate within Facebook's guidelines.

**Q: Will Facebook detect this as automated activity?**
A: The extension is designed with sophisticated human behavior simulation to avoid detection.

**Q: Can I extract numbers from private groups?**
A: You can only extract numbers from groups you have legitimate access to as a member.

**Q: What happens to my data if I uninstall the extension?**
A: All data is stored locally in your browser and will be deleted when you uninstall the extension.

**Q: Can I use this for commercial purposes?**
A: Yes, the MIT license allows commercial use. Please use responsibly and ethically.

## 🎖️ Acknowledgments

- Thanks to the Chrome Extensions API documentation
- Inspiration from various web scraping tools
- Community feedback and feature requests
- Beta testers who helped refine the tool

## 🔄 Changelog

### Version 1.0 (Current)
- ✨ Initial release with core extraction functionality
- 🛡️ Advanced stealth and anti-detection features
- 🌍 International phone number pattern support
- 📊 Real-time extraction statistics
- 💾 Local storage backup with sync recovery
- 🔄 Automatic error recovery and fallback modes
- 📱 WhatsApp-ready export format
- 🎯 Smart content expansion with safety checks

---

## 🌟 Star this Repository

If you find this extension useful, please ⭐ star this repository to help others discover it!

**Made with ❤️ for the business community**
