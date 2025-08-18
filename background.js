// Background service worker for AI on Chrome extension
class GeminiNanoService {
  constructor() {
    this.session = null;
    this.summarizer = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return { success: true, message: 'Already initialized' };

    try {
      // Check if LanguageModel is available (Chrome 138+)
      if (!('LanguageModel' in globalThis)) {
        const message = 'LanguageModel API is not available. Please use Chrome 138+ with AI features enabled.';
        console.error(message);
        return { success: false, error: 'LANGUAGE_MODEL_NOT_AVAILABLE', message };
      }

      // Check availability
      const availability = await LanguageModel.availability();
      console.log('Language model availability:', availability);

      if (availability === 'unavailable') {
        const message = 'Gemini Nano is not available on this device.';
        console.error(message);
        return { success: false, error: 'MODEL_NOT_AVAILABLE', message };
      }

      if (availability === 'downloading') {
        const message = 'Gemini Nano is downloading. Please wait and try again in a few minutes.';
        console.log(message);
        return { success: false, error: 'MODEL_DOWNLOADING', message };
      }

      if (availability === 'downloadable') {
        console.log('Gemini Nano needs to be downloaded. Creating session will trigger download...');
      }

      // Create a session (this may trigger download if needed)
      try {
        const params = await LanguageModel.params();
        this.session = await LanguageModel.create({
          temperature: Math.min(params.defaultTemperature * 1.1, params.maxTemperature),
          topK: params.defaultTopK,
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              console.log(`Model download progress: ${Math.round(e.loaded * 100)}%`);
            });
          }
        });
      } catch (sessionError) {
        if (sessionError.message?.includes('download') || sessionError.message?.includes('user activation')) {
          const message = 'Model is downloading or requires user interaction. Please try again.';
          console.log(message);
          return { success: false, error: 'MODEL_DOWNLOADING', message };
        }
        throw sessionError;
      }

      // Initialize Summarizer if available
      if ('Summarizer' in globalThis) {
        try {
          const summarizerAvailability = await Summarizer.availability();
          if (summarizerAvailability !== 'unavailable') {
            // Don't create summarizer here, create it when needed to avoid user activation issues
            console.log('Summarizer API is available');
          }
        } catch (summarizerError) {
          console.log('Summarizer API not available:', summarizerError.message);
        }
      }

      this.isInitialized = true;
      console.log('AI services initialized successfully');
      return { success: true, message: 'AI is ready' };

    } catch (error) {
      console.error('Failed to initialize AI:', error);
      let message = 'Failed to initialize AI. ';
      
      if (error.message?.includes('not supported')) {
        message += 'AI features are not supported on this device.';
      } else if (error.message?.includes('download')) {
        message += 'Model is downloading. Please wait and try again.';
      } else if (error.message?.includes('user activation')) {
        message += 'Please interact with the page first, then try again.';
      } else {
        message += 'Please check your Chrome version (138+) and try again.';
      }
      
      return { success: false, error: 'INITIALIZATION_FAILED', message, details: error.message };
    }
  }

  async generateResponse(prompt, context = '') {
    if (!this.isInitialized) {
      const result = await this.initialize();
      if (!result.success) {
        throw new Error(result.message || 'Failed to initialize AI');
      }
    }

    try {
      const fullPrompt = context ? `Context: ${context}\n\nQuery: ${prompt}` : prompt;
      const response = await this.session.prompt(fullPrompt);
      return response;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async generateStreamingResponse(prompt, context = '', onChunk) {
    if (!this.isInitialized) {
      const result = await this.initialize();
      if (!result.success) {
        throw new Error(result.message || 'Failed to initialize AI');
      }
    }

    try {
      const fullPrompt = context ? `Context: ${context}\n\nQuery: ${prompt}` : prompt;
      
      // Check if promptStreaming is available
      if (typeof this.session.promptStreaming !== 'function') {
        // Fallback to non-streaming
        const response = await this.session.prompt(fullPrompt);
        if (onChunk) onChunk(response, true); // Send complete response as final chunk
        return response;
      }

      const stream = this.session.promptStreaming(fullPrompt);
      let accumulatedResponse = '';
      
      for await (const chunk of stream) {
        const newContent = chunk.replace(accumulatedResponse, '');
        accumulatedResponse = chunk;
        
        if (newContent && onChunk) {
          onChunk(newContent, false); // Send incremental chunk
        }
      }
      
      if (onChunk) {
        onChunk('', true); // Signal completion
      }
      
      return accumulatedResponse;
    } catch (error) {
      console.error('Error generating streaming response:', error);
      throw error;
    }
  }

  async summarizeContent(content) {
    // Try to use the dedicated Summarizer API first
    if ('Summarizer' in globalThis) {
      try {
        const availability = await Summarizer.availability();
        if (availability !== 'unavailable') {
          // Create summarizer when needed
          const summarizer = await Summarizer.create({
            type: 'key-points',
            format: 'markdown',
            length: 'medium'
          });
          
          // Clean content by removing HTML tags and extra whitespace
          const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const summary = await summarizer.summarize(cleanContent);
          return summary;
        }
      } catch (summarizerError) {
        console.log('Summarizer API failed, falling back to LanguageModel:', summarizerError.message);
      }
    }

    // Fallback to LanguageModel
    const prompt = `Please provide a concise summary of the following content. Focus on the main points and key information. Please respond in the same language as the content (if content is in Turkish, respond in Turkish; if in English, respond in English; etc.):\n\n${content}`;
    return this.generateResponse(prompt);
  }

  async answerQuestion(question, context) {
    const prompt = `Based on the provided context, please answer the following question: ${question}`;
    return this.generateResponse(prompt, context);
  }

  async cleanup() {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
    if (this.summarizer) {
      this.summarizer.destroy();
      this.summarizer = null;
    }
    this.isInitialized = false;
  }
}

// Global service instance
const geminiService = new GeminiNanoService();

// Store active streaming ports
const streamingPorts = new Map();

// Handle port connections for streaming
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'streaming') {
    port.onMessage.addListener(async (request) => {
      if (request.action === 'generateStreamingResponse') {
        const requestId = request.requestId;
        streamingPorts.set(requestId, port);
        
        try {
          const streamingCallback = (chunk, isComplete) => {
            const activePort = streamingPorts.get(requestId);
            if (activePort) {
              activePort.postMessage({
                success: true,
                chunk,
                isComplete,
                requestId
              });
              
              if (isComplete) {
                streamingPorts.delete(requestId);
              }
            }
          };
          
          await geminiService.generateStreamingResponse(
            request.prompt, 
            request.context, 
            streamingCallback
          );
        } catch (error) {
          const activePort = streamingPorts.get(requestId);
          if (activePort) {
            activePort.postMessage({
              success: false,
              error: error.message,
              requestId
            });
            streamingPorts.delete(requestId);
          }
        }
      }
    });
    
    port.onDisconnect.addListener(() => {
      // Clean up any streaming connections for this port
      for (const [requestId, storedPort] of streamingPorts.entries()) {
        if (storedPort === port) {
          streamingPorts.delete(requestId);
        }
      }
    });
  }
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handleAsync = async () => {
    try {
      switch (request.action) {
        case 'initialize':
          const result = await geminiService.initialize();
          return result;

        case 'generateResponse':
          const response = await geminiService.generateResponse(request.prompt, request.context);
          return { success: true, response };

        case 'summarizeContent':
          const summary = await geminiService.summarizeContent(request.content);
          return { success: true, summary };

        case 'answerQuestion':
          const answer = await geminiService.answerQuestion(request.question, request.context);
          return { success: true, answer };

        default:
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      console.error('Background script error:', error);
      return { success: false, error: error.message };
    }
  };

  handleAsync().then(sendResponse);
  return true; // Keep message channel open for async response
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  geminiService.initialize();
});

// Initialize when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  geminiService.initialize();
});

// Cleanup on extension unload
chrome.runtime.onSuspend.addListener(() => {
  geminiService.cleanup();
});
