// Skip Dismiss Extension - Background Service Worker
// Version 2.0

console.log('Skip Dismiss Extension background service worker loaded');

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Skip Dismiss: Extension icon clicked on tab:', tab.id);
  
  // Inject and run the skip logic
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      console.log('Skip Dismiss: Manual trigger activated');
      
      // Find and click all skip buttons immediately
      const SKIP_KEYWORDS = [
        'skip', 'dismiss', 'close', 'x', '✕', '×', 'continue', 'accept',
        'agree', 'ok', 'got it', 'understood', 'later', 'not now',
        'skip ad', 'skip ads', 'dismiss ad', 'close ad'
      ];
      
      const YOUTUBE_SELECTORS = [
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        '.ytp-ad-skip-button-text',
        '.ytp-ad-skip-button-container',
        '.ytp-ad-overlay-close-button',
        '.ytp-ad-player-overlay',
        'button.ytp-ad-skip-button',
        'button.ytp-ad-skip-button-modern',
        'div.ytp-ad-skip-button',
        'div.ytp-ad-skip-button-modern',
        'div.ytp-ad-skip-button-text',
        'div.ytp-ad-skip-button-container',
        'div.ytp-ad-overlay-close-button'
      ];
      
      const GENERIC_SELECTORS = [
        'button',
        'a',
        'div[role="button"]',
        'span[role="button"]',
        '.close',
        '.dismiss',
        '.skip',
        '.x-button',
        '.close-button',
        '[aria-label*="skip"]',
        '[aria-label*="dismiss"]',
        '[aria-label*="close"]',
        '[title*="skip"]',
        '[title*="dismiss"]',
        '[title*="close"]'
      ];
      
      function isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width > 0 &&
          rect.height > 0
        );
      }
      
      function containsSkipKeyword(element) {
        if (!element) return false;
        const text = element.textContent?.toLowerCase() || '';
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        const title = element.getAttribute('title')?.toLowerCase() || '';
        const className = element.className?.toLowerCase() || '';
        const combinedText = text + ' ' + ariaLabel + ' ' + title + ' ' + className;
        return SKIP_KEYWORDS.some(keyword => combinedText.includes(keyword));
      }
      
      let clickedCount = 0;
      
      // Try YouTube selectors first
      for (const selector of YOUTUBE_SELECTORS) {
        try {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (isElementVisible(element)) {
              console.log('Manual trigger: Clicking YouTube element:', selector);
              element.click();
              clickedCount++;
            }
          }
        } catch (e) {
          console.log('Manual trigger: Error with selector:', selector, e.message);
        }
      }
      
      // Try generic selectors
      for (const selector of GENERIC_SELECTORS) {
        try {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (isElementVisible(element) && containsSkipKeyword(element)) {
              console.log('Manual trigger: Clicking generic element:', selector);
              element.click();
              clickedCount++;
            }
          }
        } catch (e) {
          console.log('Manual trigger: Error with selector:', selector, e.message);
        }
      }
      
      console.log('Manual trigger: Clicked', clickedCount, 'elements');
      return clickedCount;
    }
  }, (result) => {
    if (chrome.runtime.lastError) {
      console.error('Skip Dismiss: Error executing script:', chrome.runtime.lastError);
    } else {
      console.log('Skip Dismiss: Script executed successfully');
    }
  });
});

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Skip Dismiss Extension installed');
});
