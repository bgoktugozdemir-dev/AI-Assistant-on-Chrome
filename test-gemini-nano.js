// Test script to verify Gemini Nano availability
// Run this in Chrome DevTools console to check if Gemini Nano is ready

(async function testGeminiNano() {
  console.log('🧪 Testing Gemini Nano availability...\n');

  // Check if LanguageModel is available
  if (!('LanguageModel' in globalThis)) {
    console.error('❌ LanguageModel API is not available in this browser');
    console.log('💡 Make sure you are using Chrome 138+ with AI features enabled');
    return;
  }

  console.log('✅ LanguageModel API is available');

  // Check language model availability
  try {
    console.log('🔍 Checking language model availability...');
    const availability = await LanguageModel.availability();
    console.log('📊 Availability:', availability);

    if (availability === 'available') {
      console.log('✅ Gemini Nano is readily available!');
      
      // Test creating a session
      try {
        console.log('🚀 Testing session creation...');
        const params = await LanguageModel.params();
        const session = await LanguageModel.create({
          temperature: params.defaultTemperature,
          topK: params.defaultTopK,
        });
        console.log('✅ Session created successfully');

        // Test a simple prompt
        console.log('💭 Testing a simple prompt...');
        const response = await session.prompt('Hello! Can you respond with just "AI is working!"?');
        console.log('🤖 AI Response:', response);
        
        // Cleanup
        session.destroy();
        console.log('🧹 Session cleaned up');
        
        console.log('\n🎉 All tests passed! Your Chrome extension should work properly.');
        
      } catch (sessionError) {
        console.error('❌ Failed to create session:', sessionError);
      }
      
    } else if (availability === 'downloadable') {
      console.log('⏳ Gemini Nano needs to be downloaded first');
      console.log('💡 The model will be downloaded automatically when first used');
      
    } else if (availability === 'downloading') {
      console.log('⏳ Gemini Nano is downloading');
      console.log('💡 Please wait for the download to complete');
      
    } else {
      console.error('❌ Gemini Nano is not available:', availability);
      console.log('💡 Check your Chrome version and try again');
    }
    
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    console.log('💡 Make sure you have Chrome 138+ or enable Chrome flags:');
    console.log('   - chrome://flags/#optimization-guide-on-device-model');
    console.log('   - chrome://flags/#prompt-api-for-gemini-nano');
  }
})();

// Instructions for users
console.log(`
📋 How to use this test:
1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Copy and paste this entire script
4. Press Enter to run

🔧 If the test fails, check:
1. You're using Chrome 138+ (or Chrome Canary)
2. Required flags are enabled (if needed):
   - chrome://flags/#optimization-guide-on-device-model → "Enabled BypassPerfRequirement"
   - chrome://flags/#prompt-api-for-gemini-nano → "Enabled"
3. Restart Chrome after enabling flags
`);
