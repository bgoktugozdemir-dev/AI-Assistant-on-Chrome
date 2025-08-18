# Changelog

## Version 1.0.1 (Current)

### 🔄 **Updated to New Chrome AI APIs**

Based on the latest [Chrome AI documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api), this version updates the extension to use the current API structure:

#### **API Changes:**
- ✅ **Updated to `LanguageModel` API** (Chrome 138+)
- ✅ **Added `Summarizer` API integration** for better summarization
- ✅ **Removed deprecated permissions** from manifest.json
- ✅ **Updated availability checking** (`available`, `downloadable`, `downloading`, `unavailable`)
- ✅ **Improved session creation** with proper parameter handling

#### **Key Improvements:**
- **Better Chrome Support**: Now works with Chrome 138+ stable (not just Canary)
- **Enhanced Summarization**: Uses dedicated Summarizer API when available, falls back to LanguageModel
- **Improved Error Handling**: More specific error messages and better user guidance
- **Updated Diagnostics**: All diagnostic tools updated for new API structure
- **Better Documentation**: Updated README, QUICK_START, and diagnostic scripts

#### **Breaking Changes:**
- Requires Chrome 138+ or Chrome Canary with updated flags
- Old `ai.languageModel` API calls replaced with `LanguageModel` API
- Availability responses changed from `readily`/`after-download` to `available`/`downloadable`

#### **Migration Notes:**
If upgrading from v1.0.0:
1. Update to Chrome 138+ or latest Canary
2. Reload the extension in `chrome://extensions/`
3. Run the diagnostic script to verify setup
4. No user data or settings are affected

---

## Version 1.0.0 (Initial Release)

### 🚀 **Initial Chrome Extension Release**

#### **Features:**
- **AI on Page**: Summarize articles and answer questions about page content
- **AI for Prompt**: General-purpose AI assistant for any queries
- **Content Extraction**: Intelligent webpage content analysis
- **Floating UI**: Quick access button on all pages
- **Modern Interface**: Clean, responsive popup with tabbed design

#### **Technical:**
- Chrome Extension Manifest V3
- Integration with Gemini Nano (via deprecated API)
- Background service worker architecture
- Content script for page interaction
- Comprehensive error handling and user feedback

#### **Browser Support:**
- Chrome Canary with AI flags enabled
- Gemini Nano model integration
- Local processing (no data transmission)

---

## 🔗 References

- [Chrome Prompt API Documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api)
- [Chrome Summarizer API Documentation](https://developer.chrome.com/docs/ai/summarizer-api)
- [Chrome AI Hardware Requirements](https://developer.chrome.com/docs/extensions/ai/prompt-api#review-the-hardware-requirements)
