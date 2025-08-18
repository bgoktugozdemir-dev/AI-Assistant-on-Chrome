# Quick Start Guide - AI on Chrome Extension

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Chrome 138+
- **Option 1**: Use Chrome 138+ (stable): https://www.google.com/chrome/
- **Option 2**: Use Chrome Canary: https://www.google.com/chrome/canary/
- **Note**: Chrome 138+ includes built-in AI APIs

### Step 2: Enable AI Features (if needed)
1. Open Chrome
2. Go to: `chrome://flags/#optimization-guide-on-device-model`
3. Set to: **"Enabled BypassPerfRequirement"**
4. Go to: `chrome://flags/#prompt-api-for-gemini-nano`  
5. Set to: **"Enabled"**
6. **Restart Chrome** (this is crucial!)

### Step 3: Verify Setup
1. Open Chrome DevTools (F12)
2. In Console, paste and run:
```javascript
await LanguageModel.availability()
```
3. Should return: `"available"`, `"downloadable"`, or `"downloading"`

### Step 4: Install Extension
1. Go to `chrome://extensions/`
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `ai-on-chrome` folder
5. Extension should appear in toolbar

### Step 5: Test It
1. Click the extension icon in toolbar
2. If you see "AI Ready" status - you're good to go! 🎉
3. If you see an error, run the diagnostic script (see below)

## 🔧 Troubleshooting

### "AI is not initialized" Error?
Run this diagnostic script in DevTools Console:

1. Open any webpage
2. Press F12 to open DevTools  
3. Go to Console tab
4. Copy and paste the entire contents of `diagnose-setup.js`
5. Press Enter
6. Follow the recommendations shown

### Common Issues:
- ❌ **Using old Chrome** → Update to Chrome 138+ or use Canary
- ❌ **Flags not enabled** → Check both flags are set correctly
- ❌ **Didn't restart Chrome** → Restart after enabling flags
- ⏳ **Model downloading** → Wait 5-10 minutes, then try again

## ✅ Success Indicators

You'll know it's working when:
- Extension shows "AI Ready" status (green dot)
- You can ask questions in the "AI Prompt" tab
- You can summarize pages in the "Page AI" tab
- No error messages appear

## 🆘 Still Having Issues?

1. **Check Chrome version**: Should be 138+ or Canary
2. **Run diagnostic script**: Use `diagnose-setup.js`
3. **Check console errors**: Look for error messages in DevTools
4. **Try different page**: Some pages block content extraction
5. **Reload extension**: Go to chrome://extensions and reload

## 🎯 Quick Test

Once installed, try this:
1. Go to any news article or blog post
2. Click the extension icon
3. Switch to "Page AI" tab  
4. Click "Summarize Page"
5. Should get a summary of the article

That's it! You now have AI-powered browsing with local Gemini Nano. 🤖✨
