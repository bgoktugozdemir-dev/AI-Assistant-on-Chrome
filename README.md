# AI on Chrome Extension

A Chrome extension that integrates Gemini Nano for on-page AI analysis and general AI prompts.

## Features

### 🧠 AI on Page
- **Article Summarization**: Automatically extract and summarize the main content of any webpage
- **Question & Answer**: Ask questions about the current page content and get AI-powered answers
- **Content Analysis**: Intelligent analysis of articles, blog posts, and web content

### 💬 AI for Prompt
- **General AI Assistant**: Ask any question and get responses powered by Gemini Nano
- **Context-Aware Responses**: Get intelligent answers for general queries
- **Easy Access**: Quick access via extension popup

## Prerequisites

### Chrome Setup
1. **Chrome 138+**: You need Chrome 138 or later (stable release) or Chrome Canary
2. **Enable AI Features** (if needed): 
   - Go to `chrome://flags/#optimization-guide-on-device-model`
   - Set to "Enabled BypassPerfRequirement"
   - Go to `chrome://flags/#prompt-api-for-gemini-nano`
   - Set to "Enabled"
   - Restart Chrome after enabling flags

### Verify AI Availability
1. Open Chrome DevTools (F12)
2. In the Console, run: `await LanguageModel.availability()`
3. You should see `"available"`, `"downloadable"`, or `"downloading"`

## Installation

### Load Extension in Developer Mode
1. Open Chrome 138+ or Chrome Canary
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `ai-on-chrome` folder
6. The extension should now appear in your extensions list

### Verify Installation
1. Look for the "AI on Chrome" icon in your browser toolbar
2. You should also see a floating AI button on web pages
3. Click the extension icon to open the popup interface

## Usage

### Using AI on Page
1. Navigate to any article or webpage with text content
2. Click the extension icon or the floating AI button
3. Switch to the "Page AI" tab
4. **Summarize**: Click "Summarize Page" to get a summary of the current page
5. **Ask Questions**: Type a question about the page content and click "Ask"

### Using AI for Prompt
1. Click the extension icon to open the popup
2. Stay on the "AI Prompt" tab (default)
3. Type any question or prompt in the text area
4. Press Ctrl/Cmd + Enter or click "Send"
5. Copy responses using the copy button

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter`: Send prompt or question
- Floating button: Quick access to AI features on any page

## Technical Details

### Architecture
- **Background Script**: Handles Gemini Nano integration and API calls
- **Content Script**: Extracts page content and provides floating UI
- **Popup Interface**: Main user interface with tabs for different features
- **Manifest V3**: Modern Chrome extension architecture

### Content Extraction
The extension intelligently extracts main content by:
- Identifying article elements (`<article>`, `<main>`, etc.)
- Filtering out navigation, ads, and sidebar content
- Cleaning and processing text for optimal AI analysis
- Limiting content length to work within Gemini Nano constraints

### Privacy & Security
- **Local Processing**: All AI processing happens locally using Gemini Nano
- **No Data Transmission**: Your data never leaves your device
- **Minimal Permissions**: Only requests necessary permissions for functionality

## Troubleshooting

### "AI is not initialized" Error
This is the most common issue. Follow these steps:

1. **Run the diagnostic script**:
   - Open Chrome DevTools (F12) 
   - Go to Console tab
   - Copy and paste the contents of `diagnose-setup.js`
   - Press Enter to run the diagnostic

2. **Check your Chrome setup**:
   - ✅ Use Chrome 138+ or Chrome Canary
   - ✅ Enable required flags (if needed):
     - `chrome://flags/#optimization-guide-on-device-model` → "Enabled BypassPerfRequirement"
     - `chrome://flags/#prompt-api-for-gemini-nano` → "Enabled"
   - ✅ Restart Chrome after enabling flags

3. **Verify AI availability**:
   - Open DevTools Console
   - Run: `await LanguageModel.availability()`
   - Should return: `"available"`, `"downloadable"`, or `"downloading"`

### Model Downloading
- If you see "downloadable", the model will download automatically on first use
- If you see "downloading", wait 5-10 minutes for download to complete
- Try using the extension again after download

### AI Not Available
- Ensure you're using Chrome 138+ or Chrome Canary
- Some devices/regions may not support Gemini Nano
- Check Chrome's AI availability for your device

### Content Not Extracting
- Refresh the page and try again
- Some pages may have content protection that prevents extraction
- The extension works best on article pages and blogs

### Extension Not Loading
- Make sure you selected the correct folder when loading unpacked
- Check for errors in `chrome://extensions/` 
- Look at the Console in DevTools for error messages
- Try reloading the extension

## Development

### Project Structure
```
ai-on-chrome/
├── manifest.json          # Extension configuration
├── background.js          # Service worker with Gemini Nano integration
├── popup.html            # Popup interface HTML
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Content script for page interaction
├── content.css           # Content script styling
├── icons/                # Extension icons
└── README.md             # This file
```

### Key Components
- **GeminiNanoService**: Main class handling AI integration
- **PopupController**: Manages popup UI and interactions
- **PageContentExtractor**: Extracts and processes page content

## Limitations

- Requires Chrome Canary with specific flags enabled
- Gemini Nano has token limits for input/output
- Some websites may block content extraction
- AI responses depend on Gemini Nano availability and performance

## Contributing

1. Fork the repository
2. Make your changes
3. Test thoroughly with Chrome Canary
4. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Support

If you encounter issues:
1. Check the Prerequisites section
2. Verify Chrome Canary setup
3. Look for console errors in DevTools
4. Make sure Gemini Nano is available on your system
