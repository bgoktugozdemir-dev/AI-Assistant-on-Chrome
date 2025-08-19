// Content script for AI on Chrome extension
class PageContentExtractor {
  constructor() {
    this.init();
  }

  init() {
    this.setupMessageListener();
    this.createFloatingButton();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getPageContent') {
        const content = this.extractPageContent();
        sendResponse({ success: true, content });
      }
      return true;
    });
  }

  extractPageContent() {
    try {
      // Remove script and style elements
      const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar');
      const tempContainer = document.cloneNode(true);

      tempContainer.querySelectorAll('script, style, nav, header, footer, aside, [class*="ad"], [class*="sidebar"], [class*="menu"], [id*="ad"], [id*="sidebar"], [id*="menu"]').forEach(el => {
        el.remove();
      });

      // Try to find main content area
      const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.main-content',
        '.article-content',
        '.post-content',
        '.entry-content',
        '#content',
        '#main'
      ];

      let mainContent = null;
      for (const selector of contentSelectors) {
        const element = tempContainer.querySelector(selector);
        if (element && element.textContent.trim().length > 100) {
          mainContent = element;
          break;
        }
      }

      // If no main content found, use body
      if (!mainContent) {
        mainContent = tempContainer.body || tempContainer;
      }

      // Extract text content
      let textContent = mainContent.textContent || mainContent.innerText || '';

      // Clean up the text
      textContent = textContent
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();

      // Limit content length to avoid token limits
      const maxLength = 8000; // Reasonable limit for Gemini Nano
      if (textContent.length > maxLength) {
        textContent = textContent.substring(0, maxLength) + '...';
      }

      return textContent;
    } catch (error) {
      console.error('Error extracting page content:', error);
      return document.body.textContent || document.body.innerText || '';
    }
  }
  createFloatingButton() {
    // Floating button feature is currently disabled
    // Uncomment the code below to enable a floating AI button on pages
    
    /*
    // Create floating AI button for quick access
    const floatingButton = document.createElement('div');
    floatingButton.id = 'ai-chrome-floating-button';
    floatingButton.innerHTML = `
      <div class="ai-button-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div class="ai-button-tooltip">AI Assistant</div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #ai-chrome-floating-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      #ai-chrome-floating-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(66, 133, 244, 0.4);
      }

      #ai-chrome-floating-button .ai-button-tooltip {
        position: absolute;
        right: 64px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      #ai-chrome-floating-button:hover .ai-button-tooltip {
        opacity: 1;
      }

      #ai-chrome-floating-button .ai-button-tooltip::after {
        content: '';
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 5px solid transparent;
        border-left-color: rgba(0, 0, 0, 0.8);
      }
    `;

    // Only add if not already present
    if (!document.getElementById('ai-chrome-floating-button')) {
      document.head.appendChild(style);
      document.body.appendChild(floatingButton);

      // Add click handler to open extension popup
      floatingButton.addEventListener('click', () => {
        this.openExtensionPopup();
      });
    }
    */
  }
  openExtensionPopup() {
    // Send message to background script to open popup
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }

  // Method to highlight text on page (for future features)
  highlightText(text, className = 'ai-highlight') {
    if (!text || text.length < 3) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes(text)) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      const content = textNode.textContent;
      const index = content.indexOf(text);

      if (index !== -1) {
        const beforeText = content.substring(0, index);
        const highlightText = content.substring(index, index + text.length);
        const afterText = content.substring(index + text.length);

        const fragment = document.createDocumentFragment();

        if (beforeText) {
          fragment.appendChild(document.createTextNode(beforeText));
        }

        const highlightSpan = document.createElement('span');
        highlightSpan.className = className;
        highlightSpan.textContent = highlightText;
        highlightSpan.style.cssText = `
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 3px;
          padding: 1px 2px;
          margin: 0 1px;
        `;
        fragment.appendChild(highlightSpan);

        if (afterText) {
          fragment.appendChild(document.createTextNode(afterText));
        }

        parent.replaceChild(fragment, textNode);
      }
    });
  }

  // Method to remove highlights
  removeHighlights(className = 'ai-highlight') {
    const highlights = document.querySelectorAll(`.${className}`);
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PageContentExtractor();
  });
} else {
  new PageContentExtractor();
}
