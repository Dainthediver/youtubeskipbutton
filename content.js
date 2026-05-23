// Skip Dismiss Extension - Content Script
// Version 2.0 - With delays and multiple click attempts

console.log('Skip Dismiss Extension loaded');

// Configuration
const CONFIG = {
  initialDelay: 500,        // Initial delay before first click attempt (ms)
  clickDelay: 300,           // Delay between click attempts (ms)
  maxAttempts: 5,            // Maximum click attempts per button
  retryDelay: 1000,          // Delay between retry cycles (ms)
  maxRetries: 3,             // Maximum retry cycles
  observerEnabled: true      // Enable MutationObserver for dynamic content
};

// Keywords to look for in button text
const SKIP_KEYWORDS = [
  'skip', 'dismiss', 'close', 'x', '✕', '×', 'continue', 'accept',
  'agree', 'ok', 'got it', 'understood', 'later', 'not now',
  'skip ad', 'skip ads', 'dismiss ad', 'close ad'
];

// YouTube-specific selectors
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

// Generic selectors for other sites
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

// Track clicked elements to avoid duplicate clicks
const clickedElements = new Set();

// Check if element is visible and clickable
function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

// Check if element is enabled
function isElementEnabled(element) {
  if (!element) return false;
  
  // Check for disabled attribute
  if (element.hasAttribute('disabled')) return false;
  
  // Check for aria-disabled
  if (element.getAttribute('aria-disabled') === 'true') return false;
  
  return true;
}

// Check if element contains skip keywords
function containsSkipKeyword(element) {
  if (!element) return false;
  
  const text = element.textContent?.toLowerCase() || '';
  const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
  const title = element.getAttribute('title')?.toLowerCase() || '';
  const className = element.className?.toLowerCase() || '';
  
  const combinedText = text + ' ' + ariaLabel + ' ' + title + ' ' + className;
  
  return SKIP_KEYWORDS.some(keyword => combinedText.includes(keyword));
}

// Click element with delay and retry
async function clickElementWithRetry(element, attempt = 1) {
  if (!element || clickedElements.has(element)) {
    return false;
  }
  
  // Check if element is still visible and enabled
  if (!isElementVisible(element) || !isElementEnabled(element)) {
    console.log('Skip Dismiss: Element not visible or enabled');
    return false;
  }
  
  // Add delay before click
  await new Promise(resolve => setTimeout(resolve, CONFIG.clickDelay));
  
  try {
    console.log(`Skip Dismiss: Attempting click ${attempt}/${CONFIG.maxAttempts} on element:`, element);
    
    // Try multiple click methods
    const clickMethods = [
      () => element.click(),
      () => {
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        element.dispatchEvent(event);
      },
      () => {
        const event = new Event('click', { bubbles: true });
        element.dispatchEvent(event);
      }
    ];
    
    for (const method of clickMethods) {
      try {
        method();
        clickedElements.add(element);
        console.log('Skip Dismiss: Click successful');
        return true;
      } catch (e) {
        console.log('Skip Dismiss: Click method failed:', e.message);
      }
    }
    
    // If we haven't reached max attempts, retry
    if (attempt < CONFIG.maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.clickDelay));
      return clickElementWithRetry(element, attempt + 1);
    }
    
    return false;
  } catch (error) {
    console.error('Skip Dismiss: Error clicking element:', error);
    return false;
  }
}

// Find and click skip buttons
async function findAndClickSkipButtons() {
  console.log('Skip Dismiss: Searching for skip buttons...');
  
  let found = false;
  
  // First, try YouTube-specific selectors
  for (const selector of YOUTUBE_SELECTORS) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (isElementVisible(element) && isElementEnabled(element)) {
          console.log('Skip Dismiss: Found YouTube element with selector:', selector);
          const success = await clickElementWithRetry(element);
          if (success) {
            found = true;
          }
        }
      }
    } catch (e) {
      console.log('Skip Dismiss: Error with selector:', selector, e.message);
    }
  }
  
  // If no YouTube elements found, try generic selectors
  if (!found) {
    for (const selector of GENERIC_SELECTORS) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (isElementVisible(element) && isElementEnabled(element) && containsSkipKeyword(element)) {
            console.log('Skip Dismiss: Found generic element with selector:', selector);
            const success = await clickElementWithRetry(element);
            if (success) {
              found = true;
            }
          }
        }
      } catch (e) {
        console.log('Skip Dismiss: Error with selector:', selector, e.message);
      }
    }
  }
  
  return found;
}

// Main function with retry logic
async function main() {
  console.log('Skip Dismiss: Starting main function...');
  
  // Initial delay before first attempt
  await new Promise(resolve => setTimeout(resolve, CONFIG.initialDelay));
  
  let found = false;
  
  // Try multiple retry cycles
  for (let retry = 0; retry < CONFIG.maxRetries; retry++) {
    console.log(`Skip Dismiss: Retry cycle ${retry + 1}/${CONFIG.maxRetries}`);
    
    found = await findAndClickSkipButtons();
    
    if (found) {
      console.log('Skip Dismiss: Successfully clicked skip button');
      break;
    }
    
    // Wait before next retry
    if (retry < CONFIG.maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
    }
  }
  
  if (!found) {
    console.log('Skip Dismiss: No skip buttons found or clicked');
  }
}

// Set up MutationObserver for dynamic content
function setupObserver() {
  if (!CONFIG.observerEnabled) return;
  
  console.log('Skip Dismiss: Setting up MutationObserver...');
  
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }
    
    if (shouldCheck) {
      console.log('Skip Dismiss: DOM changed, checking for skip buttons...');
      // Debounce the check
      clearTimeout(observer.checkTimeout);
      observer.checkTimeout = setTimeout(() => {
        findAndClickSkipButtons();
      }, 500);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return observer;
}

// Initialize
let observer = null;

function init() {
  console.log('Skip Dismiss: Initializing...');
  
  // Run main function
  main();
  
  // Set up observer
  if (document.body) {
    observer = setupObserver();
  } else {
    // Wait for body to be ready
    const checkBody = setInterval(() => {
      if (document.body) {
        clearInterval(checkBody);
        observer = setupObserver();
      }
    }, 100);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Also run periodically to catch any missed buttons
setInterval(() => {
  console.log('Skip Dismiss: Periodic check...');
  findAndClickSkipButtons();
}, 5000);
