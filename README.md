# AI on Chrome Extension

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome)](https://github.com/bgoktugozdemir/ai-on-chrome)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Version](https://img.shields.io/badge/Chrome-138%2B-green)](https://www.google.com/chrome/)

A powerful Chrome extension that brings AI assistance directly to your browser using Chrome's built-in Gemini Nano. Analyze web pages, summarize articles, and get AI-powered answers - all processed locally on your device for maximum privacy.

![AI on Chrome Demo](https://via.placeholder.com/800x400?text=AI+on+Chrome+Extension+Demo)

## ✨ What Makes This Special

- **🔒 100% Private**: All AI processing happens locally - your data never leaves your device
- **⚡ Lightning Fast**: Powered by Chrome's built-in Gemini Nano for instant responses
- **🎯 Smart Content Analysis**: Intelligently extracts and analyzes main content from any webpage
- **🌍 Multi-language Support**: Responds in the same language as the content you're analyzing
- **🚀 Zero Setup**: No API keys, no accounts, no external services required

### 🧠 AI on Page

- **📝 Smart Summarization**: Instantly summarize articles, blog posts, and web content
- **❓ Contextual Q&A**: Ask specific questions about the current page and get accurate answers
- **🔍 Content Analysis**: Deep analysis of webpage content with intelligent filtering
- **🌐 Language Detection**: Automatically responds in the same language as the source content

### 💬 AI Assistant

- **🤖 General AI Chat**: Ask anything and get intelligent responses
- **⚡ Streaming Responses**: Real-time response generation with live updates
- **📋 Easy Copy**: One-click copying of AI responses
- **🎨 Markdown Support**: Rich formatting in AI responses

## 🚀 Quick Start

### 1. Install Chrome 138+

Download the latest [Chrome browser](https://www.google.com/chrome/) (version 138 or newer) or [Chrome Canary](https://www.google.com/chrome/canary/).

### 2. Install the Extension

1. Download or clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the `ai-on-chrome` folder
5. The extension will appear in your toolbar

### 3. Verify Setup

Click the extension icon - if you see "AI Ready" status, you're good to go! If not, see the [troubleshooting section](#troubleshooting).

### 4. Start Using

- **General AI**: Click the extension icon and ask any question
- **Page Analysis**: Go to any article/blog, click the extension, switch to "Page AI" tab, and summarize or ask questions

## 📋 Prerequisites

### Chrome Setup

1. **Chrome 138+**: You need Chrome 138 or later (stable release) or Chrome Canary
2. **Enable AI Features** (required for older Chrome versions):
   - **For Chrome 127-137**: Enable these flags:
     - Go to `chrome://flags/#optimization-guide-on-device-model`
     - Set to "Enabled BypassPerfRequirement"
     - Go to `chrome://flags/#prompt-api-for-gemini-nano`
     - Set to "Enabled"
     - **Restart Chrome completely** after enabling flags
   - **For Chrome 138+**: AI features should be available by default, but if not working, try the flags above

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

#### Step 1: Quick Diagnostic

1. **Run the diagnostic script**:
   - Open Chrome DevTools (F12)
   - Go to Console tab
   - Copy and paste the contents of `diagnose-setup.js`
   - Press Enter to run the diagnostic

#### Step 2: Check Chrome Version & Setup

2. **Verify Chrome version**:

   - Go to `chrome://settings/help`
   - **Required**: Chrome 138+ (stable) or Chrome Canary
   - **Update if needed**: [Chrome](https://www.google.com/chrome/) or [Chrome Canary](https://www.google.com/chrome/canary/)

3. **Enable AI flags** (if Chrome 127-137 or if 138+ isn't working):
   - `chrome://flags/#optimization-guide-on-device-model` → "Enabled BypassPerfRequirement"
   - `chrome://flags/#prompt-api-for-gemini-nano` → "Enabled"
   - **Important**: Restart Chrome completely after enabling flags

#### Step 3: Verify AI Status

4. **Test AI availability**:
   - Open DevTools Console (F12)
   - Run: `await LanguageModel.availability()`
   - **Expected results**:
     - `"available"` ✅ Ready to use
     - `"downloadable"` ⏳ Will download on first use
     - `"downloading"` ⏳ Currently downloading (wait 5-15 minutes)
     - `"unavailable"` ❌ Not supported on this device/region

#### Step 4: Manual AI Test

If the diagnostic script doesn't work, test AI manually:

```javascript
// Copy and paste this into DevTools Console (F12)
(async () => {
  console.log("🧪 Testing Chrome AI APIs...\n");

  // Check Chrome version
  const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1];
  console.log(`Chrome Version: ${chromeVersion}`);

  if (chromeVersion < 138) {
    console.log("⚠️ Chrome 138+ recommended for best AI support");
  }

  // Test LanguageModel API
  if ("LanguageModel" in window) {
    console.log("✅ LanguageModel API found");

    try {
      const availability = await LanguageModel.availability();
      console.log(`AI Status: ${availability}`);

      if (availability === "available") {
        console.log("🎉 AI is ready! The extension should work.");

        // Quick test
        try {
          const session = await LanguageModel.create();
          const response = await session.prompt("Say hello");
          console.log(`Test response: ${response}`);
          session.destroy();
          console.log("✅ AI test successful!");
        } catch (e) {
          console.log(`❌ AI test failed: ${e.message}`);
        }
      } else if (availability === "downloadable") {
        console.log("⏳ AI will download on first use");
      } else if (availability === "downloading") {
        console.log("⏳ AI is downloading... please wait");
      } else {
        console.log("❌ AI not available on this device");
      }
    } catch (e) {
      console.log(`❌ AI check failed: ${e.message}`);
    }
  } else {
    console.log("❌ LanguageModel API not found");
    console.log("💡 Try enabling Chrome flags or updating Chrome");
  }
})();
```

### Model Downloading

- If you see "downloadable", the model will download automatically on first use
- If you see "downloading", wait 5-10 minutes for download to complete
- Try using the extension again after download

### AI Not Available

- **Chrome Version**: Ensure you're using Chrome 138+ or Chrome Canary
- **Device Limitations**: Some older or low-powered devices may not support Gemini Nano
- **Regional Availability**: Gemini Nano may not be available in all countries/regions yet
- **Hardware Requirements**: Check if your device meets Chrome's AI hardware requirements
- **Alternative**: Try Chrome Canary if stable Chrome doesn't work

### Device & Regional Compatibility

**Supported Devices:**

- Most modern desktops and laptops (Windows, macOS, Linux)
- Devices with sufficient RAM (typically 4GB+)
- Chrome 138+ or Chrome Canary

**Known Limitations:**

- Some ARM-based devices may have limited support
- Very old hardware may not support the AI models
- Corporate or managed Chrome installations may have restrictions
- Some regions may have delayed rollout of AI features

**If AI is unavailable on your device:**

1. Try Chrome Canary (often has broader device support)
2. Check Chrome's official AI documentation for device requirements
3. Ensure your Chrome installation isn't managed/restricted by IT policies

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

We welcome contributions! Here's how to get started:

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** and test thoroughly with Chrome 138+ or Chrome Canary
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Submit a pull request**

### Development Guidelines

- Follow existing code style and patterns
- Test all changes with the latest Chrome versions
- Update documentation if needed
- Ensure all console.log statements are commented out for production
- Keep the extension lightweight and fast

### Bug Reports & Feature Requests

- Use GitHub Issues to report bugs or request features
- Include Chrome version, OS, and detailed steps to reproduce
- Check existing issues before creating new ones

## Security & Privacy

This extension prioritizes user privacy and security:

- **Local Processing**: All AI operations happen locally using Chrome's built-in Gemini Nano
- **No Data Transmission**: Your data never leaves your device
- **Minimal Permissions**: Only requests necessary permissions for functionality
- **Open Source**: Full source code is available for review
- **No Analytics**: No tracking or analytics code included

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2024 Burak Göktuğ Özdemir

## Support

If you encounter issues:

1. Check the Prerequisites section
2. Verify Chrome Canary setup
3. Look for console errors in DevTools
4. Make sure Gemini Nano is available on your system
