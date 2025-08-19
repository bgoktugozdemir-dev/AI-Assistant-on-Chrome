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
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupStreaming();
    await this.initializeAI();
    await this.loadCurrentPageInfo();
  }

  setupStreaming() {
    // Connect to background script for streaming
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
          this.showError(response.error || 'Streaming failed');
          this.activeStreams.delete(response.requestId);
          this.setButtonLoading(streamInfo.buttonId, false);
        }
      }
    });
    
    this.streamingPort.onDisconnect.addListener(() => {
      // console.log('Streaming port disconnected');
      // Clean up active streams
      this.activeStreams.clear();
    });
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

    this.currentTab = tabName;
  }

  async initializeAI() {
    try {
      this.updateStatus('Initializing AI...', 'loading');
      
      const response = await this.sendMessage({ action: 'initialize' });
      
      if (response.success) {
        this.isInitialized = true;
        this.updateStatus('AI Ready', 'ready');
      } else {
        this.updateStatus('AI Unavailable', 'error');
        
        // Show specific error message based on error type
        let errorMessage = response.message || 'Gemini Nano is not available.';
        
        if (response.error === 'LANGUAGE_MODEL_NOT_AVAILABLE') {
          errorMessage += '\n\n📋 Setup Steps:\n1. Use Chrome 138+ (stable) or Chrome Canary\n2. Enable flags (if needed):\n   - chrome://flags/#optimization-guide-on-device-model\n   - chrome://flags/#prompt-api-for-gemini-nano\n3. Restart Chrome after enabling flags';
        } else if (response.error === 'MODEL_DOWNLOADING') {
          errorMessage += '\n\n⏳ Please wait a few minutes for the download to complete, then try again.';
          // Auto-retry after 30 seconds
          setTimeout(() => {
            if (!this.isInitialized) {
              // console.log('Auto-retrying AI initialization...');
              this.initializeAI();
            }
          }, 30000);
        } else if (response.error === 'MODEL_NOT_AVAILABLE') {
          errorMessage += '\n\n💡 Your device may not support Gemini Nano, or the model is not available in your region.';
        }
        
        this.showError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      this.updateStatus('AI Error', 'error');
      this.showError('Failed to initialize AI. Please try reloading the extension or check the console for details.');
    }
  }

  async loadCurrentPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        document.getElementById('pageTitle').textContent = tab.title || 'Untitled';
        document.getElementById('pageUrl').textContent = tab.url || '';

        // Get page content
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'getPageContent' 
        });
        
        if (response && response.success) {
          this.currentPageContent = response.content;
        }
      }
    } catch (error) {
      console.error('Failed to load page info:', error);
      document.getElementById('pageTitle').textContent = 'Unable to access page';
      document.getElementById('pageUrl').textContent = 'Content script may not be loaded';
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

    if (!this.currentPageContent) {
      this.showError('Unable to access page content. Please refresh the page and try again.');
      return;
    }

    try {
      this.setButtonLoading('summarizePage', true);
      
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
      
      // Send streaming request
      this.streamingPort.postMessage({
        action: 'generateStreamingResponse',
        prompt: summarizePrompt,
        requestId: requestId
      });
      
    } catch (error) {
      console.error('Error summarizing page:', error);
      this.showError('An error occurred while summarizing the page.');
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

    if (!this.currentPageContent) {
      this.showError('Unable to access page content. Please refresh the page and try again.');
      return;
    }

    try {
      this.setButtonLoading('askPageQuestion', true);
      
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
      this.showError('An error occurred while processing your question.');
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
    errorDiv.textContent = message;
    
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(errorDiv, activeTab.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
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
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
