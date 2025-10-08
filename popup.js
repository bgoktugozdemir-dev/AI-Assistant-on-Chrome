// Popup script for AI on Chrome extension

// Lightweight Markdown renderer
class MarkdownRenderer {
  static render(text) {
    if (!text) return '';
    
    let html = text;
    
    // Escape HTML first to prevent XSS
    html = html.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;');
    
    // Headers (must come before bold/italic)
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\_\_\_(.*?)\_\_\_/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\_\_(.*?)\_\_/g, '<strong>$1</strong>');
    html = html.replace(/\_(.*?)\_/g, '<em>$1</em>');
    
    // Code blocks (must come before inline code)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Lists - process them more carefully
    // First mark unordered list items
    html = html.replace(/^[\*\-\+] (.+)$/gm, '<!UL!><li>$1</li>');
    
    // Then mark ordered list items  
    html = html.replace(/^\d+\. (.+)$/gm, '<!OL!><li>$1</li>');
    
    // Wrap consecutive list items in proper tags
    html = html.replace(/(<!UL!><li>.*?<\/li>(?:\n<!UL!><li>.*?<\/li>)*)/gs, (match) => {
      return '<ul>' + match.replace(/<!UL!>/g, '') + '</ul>';
    });
    
    html = html.replace(/(<!OL!><li>.*?<\/li>(?:\n<!OL!><li>.*?<\/li>)*)/gs, (match) => {
      return '<ol>' + match.replace(/<!OL!>/g, '') + '</ol>';
    });
    
    // Clean up any remaining markers
    html = html.replace(/<!UL!>/g, '');
    html = html.replace(/<!OL!>/g, '');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');
    
    // Line breaks (convert double newlines to paragraphs)
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    // Fix paragraphs around block elements
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    
    return html;
  }
}

class PopupController {
  constructor() {
    this.currentTab = 'prompt';
    this.isInitialized = false;
    this.currentPageContent = '';
    this.streamingPort = null;
    this.activeStreams = new Map(); // Track active streaming requests
    
    // New structure: multiple conversations per tab
    this.conversations = {
      prompt: {
        active: null,  // ID of active conversation
        list: []       // Array of conversations
      },
      page: {
        active: null,
        list: []
      }
    };
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupStreaming();
    await this.loadConversationHistory();
    await this.initializeAI();
    await this.loadCurrentPageInfo();
    
    // Show the new chat button for the active tab (default is prompt)
    document.getElementById('newPromptChat').style.display = 'flex';
  }

  setupStreaming() {
    // Connect to background script for streaming
    try {
      this.streamingPort = chrome.runtime.connect({ name: 'streaming' });
      
      this.streamingPort.onMessage.addListener((response) => {
        if (response.requestId && this.activeStreams.has(response.requestId)) {
          const streamInfo = this.activeStreams.get(response.requestId);
          
          if (response.success) {
            this.handleStreamingChunk(
              streamInfo.containerId,
              streamInfo.contentId,
              response.chunk,
              response.isComplete
            );
            
            if (response.isComplete) {
              this.activeStreams.delete(response.requestId);
              this.setButtonLoading(streamInfo.buttonId, false);
            }
          } else {
            const errorMsg = response.error || 'Streaming failed';
            console.error('Streaming error:', errorMsg);
            this.showError(errorMsg);
            this.activeStreams.delete(response.requestId);
            this.setButtonLoading(streamInfo.buttonId, false);
          }
        }
      });
      
      this.streamingPort.onDisconnect.addListener(() => {
        console.log('Streaming port disconnected');
        // Clean up active streams
        this.activeStreams.clear();
        
        // Try to reconnect after a short delay
        setTimeout(() => {
          if (this.isInitialized) {
            console.log('Attempting to reconnect streaming port...');
            try {
              this.streamingPort = chrome.runtime.connect({ name: 'streaming' });
            } catch (reconnectError) {
              console.error('Failed to reconnect streaming port:', reconnectError);
            }
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Failed to setup streaming:', error);
      this.showError('Failed to setup streaming connection. Please reload the extension.');
    }
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // AI Prompt tab
    const sendPromptBtn = document.getElementById('sendPrompt');
    const promptInput = document.getElementById('promptInput');
    
    sendPromptBtn.addEventListener('click', () => this.handlePromptSubmit());
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.handlePromptSubmit();
      }
    });

    // Page AI tab
    const summarizeBtn = document.getElementById('summarizePage');
    const askQuestionBtn = document.getElementById('askPageQuestion');
    const pageQuestionInput = document.getElementById('pageQuestion');

    summarizeBtn.addEventListener('click', () => this.handleSummarize());
    askQuestionBtn.addEventListener('click', () => this.handlePageQuestion());
    pageQuestionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.handlePageQuestion();
      }
    });

    // Copy buttons
    document.getElementById('copyPromptResponse').addEventListener('click', () => {
      this.copyToClipboard('promptResponseContent');
    });
    document.getElementById('copyPageResponse').addEventListener('click', () => {
      this.copyToClipboard('pageResponseContent');
    });

    // Clear buttons
    document.getElementById('clearPromptResponse').addEventListener('click', () => {
      this.clearConversation('prompt');
    });
    document.getElementById('clearPageResponse').addEventListener('click', () => {
      this.clearConversation('page');
    });

    // New chat buttons
    document.getElementById('newPromptChat').addEventListener('click', () => {
      this.startNewConversation('prompt');
    });
    document.getElementById('newPageChat').addEventListener('click', () => {
      this.startNewConversation('page');
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Show/hide appropriate new chat button
    document.getElementById('newPromptChat').style.display = tabName === 'prompt' ? 'flex' : 'none';
    document.getElementById('newPageChat').style.display = tabName === 'page' ? 'flex' : 'none';

    this.currentTab = tabName;
  }

  async initializeAI() {
    try {
      this.updateStatus('Initializing AI...', 'loading');
      
      const response = await this.sendMessage({ action: 'initialize' });
      
      // Log response for debugging
      console.log('AI Initialization response:', response);
      
      // Check if response exists
      if (!response) {
        console.error('No response received from background script');
        this.updateStatus('AI Error', 'error');
        this.showError('No response from AI service. Please reload the extension.');
        return;
      }
      
      if (response.success) {
        this.isInitialized = true;
        this.updateStatus('AI Ready', 'ready');
        console.log('AI initialized successfully');
      } else {
        this.updateStatus('AI Unavailable', 'error');
        
        // Show specific error message based on error type
        let errorMessage = response.message || 'Gemini Nano is not available.';
        
        // Log detailed error info
        console.error('AI Initialization failed:', {
          error: response.error,
          message: response.message,
          details: response.details
        });
        
        if (response.error === 'LANGUAGE_MODEL_NOT_AVAILABLE') {
          errorMessage += '\n\n📋 Setup Steps:\n1. Update to Chrome 138+ or use Chrome Canary\n2. For older Chrome versions, enable flags:\n   - chrome://flags/#optimization-guide-on-device-model → "Enabled BypassPerfRequirement"\n   - chrome://flags/#prompt-api-for-gemini-nano → "Enabled"\n3. Restart Chrome completely after enabling flags\n4. Check chrome://settings/help for your version';
        } else if (response.error === 'MODEL_DOWNLOADING') {
          errorMessage += '\n\n⏳ Gemini Nano is downloading (5-15 minutes).\nThis happens automatically on first use.\nPlease wait and try again.';
          // Auto-retry after 30 seconds
          setTimeout(() => {
            if (!this.isInitialized) {
              console.log('Auto-retrying AI initialization...');
              this.initializeAI();
            }
          }, 30000);
        } else if (response.error === 'MODEL_NOT_AVAILABLE') {
          errorMessage += '\n\n💡 Possible causes:\n- Your device doesn\'t support Gemini Nano\n- Gemini Nano not available in your region\n- Try Chrome Canary if using stable Chrome\n- Check Chrome\'s AI requirements';
        } else if (response.error === 'INITIALIZATION_FAILED') {
          // Add details if available
          if (response.details) {
            errorMessage += '\n\n🔍 Details: ' + response.details;
          }
        }
        
        this.showError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      this.updateStatus('AI Error', 'error');
      
      // More detailed error message
      let errorMsg = 'Failed to initialize AI. ';
      if (error && error.message) {
        errorMsg += error.message + ' ';
      }
      errorMsg += 'Please try reloading the extension or check the console for details.';
      
      this.showError(errorMsg);
    }
  }

  async loadCurrentPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        console.warn('No active tab found');
        document.getElementById('pageTitle').textContent = 'No active tab';
        document.getElementById('pageUrl').textContent = 'Please open a webpage';
        return;
      }

      // Set basic tab info
      document.getElementById('pageTitle').textContent = tab.title || 'Untitled';
      document.getElementById('pageUrl').textContent = tab.url || '';

      // Check if URL is accessible (not chrome:// or other restricted URLs)
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        console.log('Cannot access restricted URL:', tab.url);
        this.currentPageContent = '';
        return;
      }

      try {
        // Try to get page content from content script
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'getPageContent' 
        });
        
        if (response && response.success) {
          this.currentPageContent = response.content;
          console.log('Page content loaded successfully, length:', this.currentPageContent.length);
        } else {
          console.warn('Content script returned unsuccessful response:', response);
          this.currentPageContent = '';
        }
      } catch (contentScriptError) {
        // Content script not loaded, try to inject it
        console.log('Content script not found, attempting to inject...', contentScriptError.message);
        
        try {
          // Inject content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          // Wait a bit for the script to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Try again to get content
          const retryResponse = await chrome.tabs.sendMessage(tab.id, { 
            action: 'getPageContent' 
          });
          
          if (retryResponse && retryResponse.success) {
            this.currentPageContent = retryResponse.content;
            console.log('Page content loaded after injection, length:', this.currentPageContent.length);
          } else {
            console.warn('Failed to get content even after injection');
            this.currentPageContent = '';
          }
        } catch (injectError) {
          console.error('Failed to inject content script:', injectError);
          this.currentPageContent = '';
          // Don't show error to user, just log it
        }
      }
    } catch (error) {
      console.error('Failed to load page info:', error);
      document.getElementById('pageTitle').textContent = 'Unable to access page';
      document.getElementById('pageUrl').textContent = error.message || 'Unknown error';
    }
  }

  async handlePromptSubmit() {
    const input = document.getElementById('promptInput');
    const prompt = input.value.trim();
    
    if (!prompt) return;
    
    if (!this.isInitialized) {
      this.showError('AI is not initialized. Please wait or try reloading the extension.');
      return;
    }

    try {
      this.setButtonLoading('sendPrompt', true);
      
      // Get active conversation
      const activeConv = this.getActiveConversation('prompt');
      if (!activeConv) {
        this.createNewConversation('prompt');
      }
      
      // Save prompt to active conversation
      const conv = this.getActiveConversation('prompt');
      conv.messages.push({
        prompt: prompt,
        response: null,
        timestamp: new Date().toISOString()
      });
      conv.updatedAt = new Date().toISOString();
      
      // Initialize streaming response UI
      this.initializeStreamingResponse('promptResponse', 'promptResponseContent');
      
      // Generate unique request ID
      const requestId = 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store stream info
      this.activeStreams.set(requestId, {
        containerId: 'promptResponse',
        contentId: 'promptResponseContent',
        buttonId: 'sendPrompt'
      });
      
      // Send streaming request
      this.streamingPort.postMessage({
        action: 'generateStreamingResponse',
        prompt: prompt,
        requestId: requestId
      });
      
      input.value = '';
      
    } catch (error) {
      console.error('Error handling prompt:', error);
      this.showError('An error occurred while processing your request.');
      this.setButtonLoading('sendPrompt', false);
    }
  }

  async handleSummarize() {
    if (!this.isInitialized) {
      this.showError('AI is not initialized. Please wait or try reloading the extension.');
      return;
    }

    if (!this.currentPageContent || this.currentPageContent.trim().length === 0) {
      this.showError('Unable to access page content. Please refresh the page and try again, or check if you are on a restricted page (chrome://, etc.).');
      return;
    }

    try {
      this.setButtonLoading('summarizePage', true);
      
      // Get active conversation
      const activeConv = this.getActiveConversation('page');
      if (!activeConv) {
        this.createNewConversation('page');
      }
      
      // Save to active conversation
      const conv = this.getActiveConversation('page');
      conv.messages.push({
        type: 'summarize',
        prompt: 'Summarize page',
        response: null,
        timestamp: new Date().toISOString()
      });
      conv.updatedAt = new Date().toISOString();
      
      // Initialize streaming response UI
      this.initializeStreamingResponse('pageResponse', 'pageResponseContent');
      
      // Generate unique request ID
      const requestId = 'summarize_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store stream info
      this.activeStreams.set(requestId, {
        containerId: 'pageResponse',
        contentId: 'pageResponseContent',
        buttonId: 'summarizePage'
      });
      
      // Create summarization prompt
      const summarizePrompt = `Please provide a concise summary of the following content. Focus on the main points and key information. Please respond in the same language as the content (if content is in Turkish, respond in Turkish; if in English, respond in English; etc.):\n\n${this.currentPageContent}`;
      
      console.log('Sending summarize request, content length:', this.currentPageContent.length);
      
      // Send streaming request
      this.streamingPort.postMessage({
        action: 'generateStreamingResponse',
        prompt: summarizePrompt,
        requestId: requestId
      });
      
    } catch (error) {
      console.error('Error summarizing page:', error);
      this.showError('An error occurred while summarizing the page. ' + (error.message || ''));
      this.setButtonLoading('summarizePage', false);
    }
  }

  async handlePageQuestion() {
    const input = document.getElementById('pageQuestion');
    const question = input.value.trim();
    
    if (!question) return;
    
    if (!this.isInitialized) {
      this.showError('AI is not initialized. Please wait or try reloading the extension.');
      return;
    }

    if (!this.currentPageContent || this.currentPageContent.trim().length === 0) {
      this.showError('Unable to access page content. Please refresh the page and try again, or check if you are on a restricted page (chrome://, etc.).');
      return;
    }

    try {
      this.setButtonLoading('askPageQuestion', true);
      
      // Get active conversation
      const activeConv = this.getActiveConversation('page');
      if (!activeConv) {
        this.createNewConversation('page');
      }
      
      // Save to active conversation
      const conv = this.getActiveConversation('page');
      conv.messages.push({
        type: 'question',
        prompt: question,
        response: null,
        timestamp: new Date().toISOString()
      });
      conv.updatedAt = new Date().toISOString();
      
      // Initialize streaming response UI
      this.initializeStreamingResponse('pageResponse', 'pageResponseContent');
      
      // Generate unique request ID
      const requestId = 'question_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store stream info
      this.activeStreams.set(requestId, {
        containerId: 'pageResponse',
        contentId: 'pageResponseContent',
        buttonId: 'askPageQuestion'
      });
      
      console.log('Sending page question, content length:', this.currentPageContent.length);
      
      // Send streaming request
      this.streamingPort.postMessage({
        action: 'generateStreamingResponse',
        prompt: question,
        context: this.currentPageContent,
        requestId: requestId
      });
      
      input.value = '';
      
    } catch (error) {
      console.error('Error answering question:', error);
      this.showError('An error occurred while processing your question. ' + (error.message || ''));
      this.setButtonLoading('askPageQuestion', false);
    }
  }

  updateStatus(text, status) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    
    statusText.textContent = text;
    statusDot.className = `status-dot ${status}`;
  }

  setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    const buttonText = button.querySelector('.button-text');
    const spinner = button.querySelector('.loading-spinner');
    
    button.disabled = loading;
    buttonText.style.display = loading ? 'none' : 'inline';
    spinner.style.display = loading ? 'block' : 'none';
  }

  showResponse(containerId, contentId, content) {
    const container = document.getElementById(containerId);
    const contentElement = document.getElementById(contentId);
    
    // Store original text for copying
    contentElement.dataset.originalText = content;
    
    // Render markdown to HTML
    const htmlContent = MarkdownRenderer.render(content);
    contentElement.innerHTML = htmlContent;
    container.style.display = 'block';
    
    // Scroll to response
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  initializeStreamingResponse(containerId, contentId) {
    const container = document.getElementById(containerId);
    const contentElement = document.getElementById(contentId);
    
    // Clear previous content and show container
    contentElement.innerHTML = '';
    contentElement.dataset.originalText = '';
    contentElement.dataset.streamingContent = '';
    container.style.display = 'block';
    
    // Add streaming indicator
    const streamingIndicator = document.createElement('div');
    streamingIndicator.className = 'streaming-indicator';
    streamingIndicator.innerHTML = '<div class="streaming-dots"><span></span><span></span><span></span></div><span>AI is generating response...</span>';
    contentElement.appendChild(streamingIndicator);
    
    // Scroll to response
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  handleStreamingChunk(containerId, contentId, chunk, isComplete) {
    const contentElement = document.getElementById(contentId);
    
    if (isComplete) {
      // Remove streaming indicator
      const indicator = contentElement.querySelector('.streaming-indicator');
      if (indicator) {
        indicator.remove();
      }
      
      // Final render of complete content
      const fullContent = contentElement.dataset.streamingContent || '';
      contentElement.dataset.originalText = fullContent;
      const htmlContent = MarkdownRenderer.render(fullContent);
      contentElement.innerHTML = htmlContent;
      
      // Save to active conversation
      const tabName = containerId === 'promptResponse' ? 'prompt' : 'page';
      if (fullContent) {
        const activeConv = this.getActiveConversation(tabName);
        if (activeConv && activeConv.messages.length > 0) {
          // Update the last message with the response
          const lastMessage = activeConv.messages[activeConv.messages.length - 1];
          lastMessage.response = fullContent;
          lastMessage.timestamp = new Date().toISOString();
          activeConv.updatedAt = new Date().toISOString();
        }
        this.saveConversationHistory();
      }
      
      return;
    }
    
    if (chunk) {
      // Accumulate streaming content
      const currentContent = contentElement.dataset.streamingContent || '';
      const newContent = currentContent + chunk;
      contentElement.dataset.streamingContent = newContent;
      
      // Remove streaming indicator temporarily
      const indicator = contentElement.querySelector('.streaming-indicator');
      if (indicator) {
        indicator.remove();
      }
      
      // Render current content with markdown
      const htmlContent = MarkdownRenderer.render(newContent);
      contentElement.innerHTML = htmlContent;
      
      // Re-add streaming indicator
      const streamingIndicator = document.createElement('div');
      streamingIndicator.className = 'streaming-indicator';
      streamingIndicator.innerHTML = '<div class="streaming-dots"><span></span><span></span><span></span></div><span>AI is generating response...</span>';
      contentElement.appendChild(streamingIndicator);
      
      // Auto-scroll to keep indicator visible
      const container = document.getElementById(containerId);
      container.scrollTop = container.scrollHeight;
    }
  }

  showError(message) {
    // Remove existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    
    // Handle multi-line error messages
    if (message.includes('\n')) {
      errorDiv.style.whiteSpace = 'pre-wrap';
    }
    
    errorDiv.textContent = message;
    
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
      activeTab.insertBefore(errorDiv, activeTab.firstChild);
      
      // Auto remove after 10 seconds for longer messages, 5 seconds for short ones
      const timeout = message.length > 100 ? 10000 : 5000;
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, timeout);
    } else {
      console.error('Error message:', message);
    }
  }

  async copyToClipboard(elementId) {
    try {
      const element = document.getElementById(elementId);
      // Get the original markdown text if available, otherwise use textContent
      const text = element.dataset.originalText || element.textContent;
      
      await navigator.clipboard.writeText(text);
      
      // Show success feedback
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = 'Copied to clipboard!';
      
      const activeTab = document.querySelector('.tab-content.active');
      activeTab.insertBefore(successDiv, activeTab.firstChild);
      
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.remove();
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showError('Failed to copy to clipboard');
    }
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          // Check for runtime errors
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message || 'Communication error'));
            return;
          }
          
          // Check if response is valid
          if (response === undefined) {
            console.error('Undefined response received');
            reject(new Error('No response from background script'));
            return;
          }
          
          resolve(response);
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        reject(error);
      }
    });
  }

  async loadConversationHistory() {
    try {
      const result = await chrome.storage.local.get(['conversations']);
      if (result.conversations) {
        this.conversations = result.conversations;
        console.log('Loaded conversations:', this.conversations);
      } else {
        // Migrate old format if exists
        const oldResult = await chrome.storage.local.get(['conversationHistory']);
        if (oldResult.conversationHistory) {
          console.log('Migrating old conversation format...');
          this.migrateOldFormat(oldResult.conversationHistory);
        }
      }
      
      // Create initial conversation if none exists
      if (!this.conversations.prompt.active && this.conversations.prompt.list.length === 0) {
        this.createNewConversation('prompt');
      }
      if (!this.conversations.page.active && this.conversations.page.list.length === 0) {
        this.createNewConversation('page');
      }
      
      // Restore active conversations
      this.restoreActiveConversation('prompt');
      this.restoreActiveConversation('page');
      
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      // Initialize with empty conversations
      this.createNewConversation('prompt');
      this.createNewConversation('page');
    }
  }

  migrateOldFormat(oldHistory) {
    // Convert old flat array format to new conversation format
    if (oldHistory.prompt && oldHistory.prompt.length > 0) {
      const convId = this.generateConversationId();
      this.conversations.prompt.list.push({
        id: convId,
        messages: oldHistory.prompt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      this.conversations.prompt.active = convId;
    }
    
    if (oldHistory.page && oldHistory.page.length > 0) {
      const convId = this.generateConversationId();
      this.conversations.page.list.push({
        id: convId,
        messages: oldHistory.page,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      this.conversations.page.active = convId;
    }
    
    this.saveConversationHistory();
  }

  restoreActiveConversation(tabName) {
    const activeId = this.conversations[tabName].active;
    if (!activeId) return;
    
    const conversation = this.conversations[tabName].list.find(c => c.id === activeId);
    if (!conversation || !conversation.messages || conversation.messages.length === 0) return;
    
    // Show last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage.response) {
      const containerId = tabName === 'prompt' ? 'promptResponse' : 'pageResponse';
      const contentId = tabName === 'prompt' ? 'promptResponseContent' : 'pageResponseContent';
      this.showResponse(containerId, contentId, lastMessage.response);
    }
  }

  generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  createNewConversation(tabName) {
    const convId = this.generateConversationId();
    const newConv = {
      id: convId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.conversations[tabName].list.push(newConv);
    this.conversations[tabName].active = convId;
    
    console.log(`Created new conversation for ${tabName}:`, convId);
  }

  getActiveConversation(tabName) {
    const activeId = this.conversations[tabName].active;
    return this.conversations[tabName].list.find(c => c.id === activeId);
  }

  async saveConversationHistory() {
    try {
      await chrome.storage.local.set({ conversations: this.conversations });
      console.log('Saved conversations');
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  async startNewConversation(tabName) {
    try {
      // Create new conversation
      this.createNewConversation(tabName);
      
      // Clear UI
      const containerId = tabName === 'prompt' ? 'promptResponse' : 'pageResponse';
      const contentId = tabName === 'prompt' ? 'promptResponseContent' : 'pageResponseContent';
      
      const container = document.getElementById(containerId);
      const contentElement = document.getElementById(contentId);
      
      contentElement.innerHTML = '';
      contentElement.dataset.originalText = '';
      contentElement.dataset.streamingContent = '';
      container.style.display = 'none';
      
      // Save to storage
      await this.saveConversationHistory();
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = '✨ New conversation started!';
      
      const activeTab = document.querySelector('.tab-content.active');
      if (activeTab) {
        activeTab.insertBefore(successDiv, activeTab.firstChild);
        
        setTimeout(() => {
          if (successDiv.parentNode) {
            successDiv.remove();
          }
        }, 2000);
      }
      
      console.log(`Started new ${tabName} conversation`);
    } catch (error) {
      console.error('Failed to start new conversation:', error);
      this.showError('Failed to start new conversation');
    }
  }

  async clearConversation(tabName) {
    try {
      const activeConv = this.getActiveConversation(tabName);
      if (activeConv) {
        // Clear messages in active conversation
        activeConv.messages = [];
        activeConv.updatedAt = new Date().toISOString();
      }
      
      // Clear from storage
      await this.saveConversationHistory();
      
      // Clear UI
      const containerId = tabName === 'prompt' ? 'promptResponse' : 'pageResponse';
      const contentId = tabName === 'prompt' ? 'promptResponseContent' : 'pageResponseContent';
      
      const container = document.getElementById(containerId);
      const contentElement = document.getElementById(contentId);
      
      contentElement.innerHTML = '';
      contentElement.dataset.originalText = '';
      contentElement.dataset.streamingContent = '';
      container.style.display = 'none';
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'success-message';
      successDiv.textContent = 'Conversation cleared!';
      
      const activeTab = document.querySelector('.tab-content.active');
      if (activeTab) {
        activeTab.insertBefore(successDiv, activeTab.firstChild);
        
        setTimeout(() => {
          if (successDiv.parentNode) {
            successDiv.remove();
          }
        }, 2000);
      }
      
      console.log(`Cleared ${tabName} conversation`);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      this.showError('Failed to clear conversation');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
