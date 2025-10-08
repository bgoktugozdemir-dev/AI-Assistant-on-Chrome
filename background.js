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
      // console.log('Language model availability:', availability);

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
        // console.log('Gemini Nano needs to be downloaded. Creating session will trigger download...');
      }

      // Create a session (this may trigger download if needed)
      try {
        let temperature = 0.8;
        let topK = 3;

        try {
          const params = await LanguageModel.params();
          console.log('LanguageModel params:', params);

          // Validate and clamp parameters to safe values
          if (params.defaultTemperature && params.maxTemperature) {
            temperature = Math.max(
              0.0,
              Math.min(
                params.defaultTemperature * 1.1,
                params.maxTemperature || 1.0
              )
            );
          }

          // topK must be a positive integer, typically between 1 and 40
          if (typeof params.defaultTopK === 'number' && !isNaN(params.defaultTopK) && params.defaultTopK >= 1) {
            topK = Math.max(1, Math.min(Math.floor(params.defaultTopK), 40));
          } else {
            console.warn('Invalid defaultTopK:', params.defaultTopK, 'using default value 3');
          }
        } catch (paramsError) {
          console.warn('Failed to get model params, using safe defaults:', paramsError.message);
        }

        console.log('Creating session with temperature:', temperature, 'topK:', topK);

        this.session = await LanguageModel.create({
          temperature: temperature,
          topK: topK,
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              console.log(`Model download progress: ${Math.round(e.loaded * 100)}%`);
            });
          }
        });

        console.log('Session created successfully');
      } catch (sessionError) {
        console.error('Session creation error:', sessionError);
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
            // console.log('Summarizer API is available');
          }
        } catch (summarizerError) {
          // console.log('Summarizer API not available:', summarizerError.message);
        }
      }

      this.isInitialized = true;
      // console.log('AI services initialized successfully');
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

    if (!this.session) {
      throw new Error('AI session is not available. Please reinitialize the extension.');
    }

    try {
      const fullPrompt = context ? `Context: ${context}\n\nQuery: ${prompt}` : prompt;

      // Check if promptStreaming is available
      if (typeof this.session.promptStreaming !== 'function') {
        // Fallback to non-streaming
        if (typeof this.session.prompt !== 'function') {
          throw new Error('Neither prompt nor promptStreaming methods are available.');
        }

        const response = await this.session.prompt(fullPrompt);

        // Send response in chunks to simulate streaming for consistent UI behavior
        if (onChunk) {
          // Split response into words for smoother display
          const words = response.split(' ');
          let accumulated = '';

          for (let i = 0; i < words.length; i++) {
            const word = words[i] + (i < words.length - 1 ? ' ' : '');
            accumulated += word;
            onChunk(word, false);
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          onChunk('', true); // Signal completion
        }

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
        // console.log('Summarizer API failed, falling back to LanguageModel:', summarizerError.message);
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
              try {
                activePort.postMessage({
                  success: true,
                  chunk,
                  isComplete,
                  requestId
                });

                if (isComplete) {
                  streamingPorts.delete(requestId);
                }
              } catch (postError) {
                console.error('Error posting message to port:', postError);
                streamingPorts.delete(requestId);
              }
            }
          };

          await geminiService.generateStreamingResponse(
            request.prompt,
            request.context || '',
            streamingCallback
          );
        } catch (error) {
          console.error('Streaming error:', error);
          const activePort = streamingPorts.get(requestId);
          if (activePort) {
            try {
              activePort.postMessage({
                success: false,
                error: error.message || 'Unknown error - check Chrome version and AI availability',
                requestId
              });
            } catch (postError) {
              console.error('Error posting error message to port:', postError);
            }
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
      // Validate request
      if (!request || !request.action) {
        console.error('Invalid request:', request);
        return { success: false, error: 'INVALID_REQUEST', message: 'Invalid request format' };
      }

      console.log('Handling request:', request.action);

      switch (request.action) {
        case 'initialize':
          const result = await geminiService.initialize();
          console.log('Initialize result:', result);
          return result;

        case 'generateResponse':
          if (!request.prompt) {
            return { success: false, error: 'MISSING_PROMPT', message: 'Prompt is required' };
          }
          const response = await geminiService.generateResponse(request.prompt, request.context || '');
          return { success: true, response };

        case 'summarizeContent':
          if (!request.content) {
            return { success: false, error: 'MISSING_CONTENT', message: 'Content is required' };
          }
          const summary = await geminiService.summarizeContent(request.content);
          return { success: true, summary };

        case 'answerQuestion':
          if (!request.question || !request.context) {
            return { success: false, error: 'MISSING_PARAMETERS', message: 'Question and context are required' };
          }
          const answer = await geminiService.answerQuestion(request.question, request.context);
          return { success: true, answer };

        default:
          console.error('Unknown action:', request.action);
          return { success: false, error: 'UNKNOWN_ACTION', message: `Unknown action: ${request.action}` };
      }
    } catch (error) {
      console.error('Background script error:', error);
      return {
        success: false,
        error: 'BACKGROUND_ERROR',
        message: error.message || 'An error occurred in the background script',
        details: error.stack
      };
    }
  };

  handleAsync()
    .then(response => {
      console.log('Sending response:', response);
      sendResponse(response);
    })
    .catch(error => {
      console.error('Failed to handle request:', error);
      sendResponse({
        success: false,
        error: 'HANDLER_ERROR',
        message: 'Failed to process request',
        details: error.message
      });
    });

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
