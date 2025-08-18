// Quick diagnostic script for AI on Chrome extension
// Run this in Chrome DevTools console to diagnose setup issues

(async function diagnoseSetup() {
  console.log('🔍 AI on Chrome - Setup Diagnostics\n');
  
  const results = {
    browser: '❌',
    languageModel: '❌',
    summarizer: '❌',
    availability: '❌',
    session: '❌'
  };

  // Check 1: Browser type
  console.log('1️⃣ Checking browser...');
  const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
  const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;
  
  if (navigator.userAgent.includes('Chrome')) {
    if (chromeVersion >= 138) {
      results.browser = `✅ Chrome ${chromeVersion} detected (supports AI APIs)`;
    } else if (chromeVersion >= 127) {
      results.browser = `⚠️ Chrome ${chromeVersion} detected - Chrome 138+ recommended`;
    } else {
      results.browser = `❌ Chrome ${chromeVersion} detected - need Chrome 138+`;
    }
  } else {
    results.browser = '❌ Not using Chrome';
  }
  console.log(results.browser);

  // Check 2: LanguageModel API availability
  console.log('\n2️⃣ Checking LanguageModel API...');
  if ('LanguageModel' in globalThis) {
    results.languageModel = '✅ LanguageModel API available';
    console.log(results.languageModel);
    
    // Check 3: Summarizer API
    console.log('\n3️⃣ Checking Summarizer API...');
    if ('Summarizer' in globalThis) {
      results.summarizer = '✅ Summarizer API available';
      console.log(results.summarizer);
    } else {
      results.summarizer = '❌ Summarizer API not available';
      console.log(results.summarizer);
    }
    
    // Check 4: Availability
    console.log('\n4️⃣ Checking availability...');
    try {
      const availability = await LanguageModel.availability();
      console.log('Availability:', availability);
      
      if (availability === 'available') {
        results.availability = '✅ Model readily available';
      } else if (availability === 'downloadable') {
        results.availability = '⏳ Model available after download';
      } else if (availability === 'downloading') {
        results.availability = '⏳ Model is downloading';
      } else {
        results.availability = `❌ Model not available: ${availability}`;
      }
      console.log(results.availability);
      
      // Check 5: Session creation
      if (availability === 'available' || availability === 'downloadable') {
        console.log('\n5️⃣ Testing session creation...');
        try {
          const params = await LanguageModel.params();
          console.log('Model params:', params);
          
          const session = await LanguageModel.create({
            temperature: params.defaultTemperature,
            topK: params.defaultTopK,
          });
          results.session = '✅ Session created successfully';
          console.log(results.session);
          
          // Test a simple prompt
          console.log('\n6️⃣ Testing prompt...');
          const response = await session.prompt('Say "Hello from Gemini Nano!"');
          console.log('✅ Test response:', response);
          
          session.destroy();
          console.log('✅ Session cleaned up');
          
        } catch (sessionError) {
          results.session = `❌ Session creation failed: ${sessionError.message}`;
          console.log(results.session);
        }
      }
      
    } catch (availabilityError) {
      results.availability = `❌ Availability check failed: ${availabilityError.message}`;
      console.log(results.availability);
    }
    
  } else {
    results.languageModel = '❌ LanguageModel API not available';
    console.log(results.languageModel);
  }

  // Summary
  console.log('\n📊 DIAGNOSIS SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
  Object.entries(results).forEach(([key, value]) => {
    console.log(`${key.padEnd(15)}: ${value}`);
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!results.browser.includes('✅')) {
    console.log('🔧 Update to Chrome 138+: https://www.google.com/chrome/');
    console.log('   Or use Chrome Canary: https://www.google.com/chrome/canary/');
  }
  
  if (!results.languageModel.includes('✅')) {
    console.log('🔧 Enable Chrome flags (if needed):');
    console.log('   • chrome://flags/#optimization-guide-on-device-model → "Enabled BypassPerfRequirement"');
    console.log('   • chrome://flags/#prompt-api-for-gemini-nano → "Enabled"');
    console.log('   • Restart Chrome after enabling flags');
  }
  
  if (results.availability.includes('after-download') || results.availability.includes('downloading')) {
    console.log('⏳ Model will download automatically on first use. Please wait...');
  }
  
  if (results.session.includes('✅')) {
    console.log('🎉 Your setup is ready! The extension should work properly.');
  }
  
  console.log('\n🔗 For more help, check the README.md file in the extension folder.');
  
})().catch(error => {
  console.error('❌ Diagnostic script failed:', error);
  console.log('\n💡 This might indicate a serious setup issue. Please check:');
  console.log('1. You are using Chrome 138+ or Chrome Canary');
  console.log('2. Required flags are enabled (if needed)');
  console.log('3. Chrome has been restarted after enabling flags');
});
