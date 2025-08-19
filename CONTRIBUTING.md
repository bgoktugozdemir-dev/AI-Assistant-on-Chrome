# Contributing to AI on Chrome Extension

Thank you for your interest in contributing to the AI on Chrome Extension! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Chrome 138+ or Chrome Canary
- Basic knowledge of JavaScript, HTML, and CSS
- Understanding of Chrome Extension APIs
- Familiarity with Chrome's AI APIs (Gemini Nano)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/ai-on-chrome.git
   cd ai-on-chrome
   ```

2. **Load Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

3. **Test Changes**
   - Make your changes
   - Click the reload button on the extension card in `chrome://extensions/`
   - Test the functionality

## 🛠️ Development Guidelines

### Code Style

- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions small and focused
- Use modern JavaScript features (ES6+)

### File Structure

```
ai-on-chrome/
├── manifest.json          # Extension configuration
├── background.js          # Service worker with AI integration
├── content.js            # Content script for page interaction
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── content.css           # Content script styling
├── icons/                # Extension icons
├── diagnose-setup.js     # Diagnostic utility
└── test-gemini-nano.js   # Testing utility
```

### Key Components

- **GeminiNanoService**: Handles AI integration and session management
- **PopupController**: Manages popup UI and user interactions
- **PageContentExtractor**: Extracts and processes webpage content
- **MarkdownRenderer**: Renders AI responses with formatting

## 🔧 Making Changes

### Before You Start

1. Check existing issues to avoid duplicate work
2. Create an issue to discuss major changes
3. Fork the repository and create a feature branch

### Development Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the code style guidelines
   - Test thoroughly with Chrome 138+ or Chrome Canary
   - Update documentation if needed

3. **Test Your Changes**
   - Load the extension in Chrome
   - Test all functionality (AI prompt, page analysis, summarization)
   - Check error console for any issues
   - Test on different websites and content types

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: descriptive commit message"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a pull request on GitHub.

## 🧪 Testing

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] AI initialization works correctly
- [ ] General AI prompt functionality
- [ ] Page summarization works on various websites
- [ ] Page Q&A functionality
- [ ] Error handling for unsupported pages
- [ ] UI responsiveness and styling
- [ ] Copy-to-clipboard functionality

### Testing with Different Content

Test the extension with:
- News articles
- Blog posts
- Documentation pages
- E-commerce sites
- Social media (where possible)
- Different languages

## 🚨 Important Notes

### Security Considerations

- Never add external API calls or data transmission
- All AI processing must remain local
- Don't introduce new permissions without discussion
- Validate all user inputs
- Handle errors gracefully

### Performance Guidelines

- Keep the extension lightweight
- Optimize content extraction for speed
- Minimize memory usage
- Comment out console.log statements for production

### Chrome AI API Guidelines

- Follow Chrome's AI API documentation
- Handle all availability states properly
- Implement proper error handling for AI failures
- Respect token limits and constraints

## 📝 Pull Request Guidelines

### PR Requirements

- [ ] Clear, descriptive title
- [ ] Detailed description of changes
- [ ] Link to related issue (if applicable)
- [ ] Screenshots/GIFs for UI changes
- [ ] Testing instructions
- [ ] Updated documentation (if needed)

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Chrome 138+
- [ ] Tested on Chrome Canary
- [ ] Tested with various websites
- [ ] No console errors

## Screenshots
(if applicable)
```

## 🐛 Bug Reports

When reporting bugs, please include:

- Chrome version and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots/videos (if helpful)

## 💡 Feature Requests

For feature requests:

- Describe the feature and use case
- Explain why it would be valuable
- Consider implementation complexity
- Check if it aligns with project goals

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome AI APIs](https://developer.chrome.com/docs/extensions/ai/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Gemini Nano Documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api)

## 🙋‍♀️ Questions?

If you have questions:

1. Check existing issues and documentation
2. Create a new issue with the "question" label
3. Be specific about what you're trying to achieve

## 🎉 Recognition

All contributors will be recognized in our README and releases. Thank you for helping make AI on Chrome better!

---

By contributing, you agree that your contributions will be licensed under the MIT License.
