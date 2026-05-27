// ==========================================
// YT Skip Button v3.0 - content-isolated.js  
// Isolated world - handles YT UI overlays, dialogs, pop-ups
// Can't touch isTrusted but can manipulate DOM elements that are just HTML
// ==========================================
(function() {
    'use strict';
    
    if (window.__ytSkipIsolated__) return;
    window.__ytSkipIsolated__ = true;
    
    const CLICKED = new WeakSet();
    
    // ===== OVERLAY / BANNER ADS =====
    const AD_OVERLAYS = [
        'ytd-action-companion-ad-renderer',
        'ytd-banner-promo-renderer',
        'ytd-display-ad-renderer',
        'ytd-ad-slot-renderer',
        'ytd-in-feed-ad-layout-renderer',
        'ytd-promoted-sparkles-web-renderer',
        'ytd-promoted-video-renderer',
        '#masthead-ad',
        '#player-ads',
        'ytd-product-shelf-renderer',
        'ytd-rich-merchandise-shelf-renderer',
        'ytd-shopping-companion-ad-renderer',
    ];
    
    // ===== CLOSE / DISMISS PATTERNS =====
    function closeOverlays() {
        for (const sel of AD_OVERLAYS) {
            try {
                const ads = document.querySelectorAll(sel);
                for (const ad of ads) {
                    if (CLICKED.has(ad)) continue;
                    
                    // Try to find X/close/dismiss button in the ad
                    const closeBtn = ad.querySelector('button, [role="button"], ytd-button-renderer button');
                    if (closeBtn) {
                        closeBtn.click();
                        CLICKED.add(ad);
                    } else {
                        // If ad is removable, try to remove its parent (for in-feed ads)
                        try { ad.style.display = 'none'; } catch(e) {}
                    }
                }
            } catch(e) {}
        }
    }
    
    // ===== PROMO / SURVEY / DIALOG DISMISS =====
    function dismissDialogs() {
        const dialogBtns = document.querySelectorAll(
            'ytd-popup-container tp-yt-paper-dialog button, ' +
            'ytd-popup-container ytd-button-renderer button, ' +
            'paper-dialog button, tp-yt-paper-dialog button, ' +
            '.upsell-dialog button, .promo-dialog button, ' +
            'ytd-consent-bump-v2-lightweight button'
        );
        
        for (const btn of dialogBtns) {
            if (CLICKED.has(btn)) continue;
            
            const label = (btn.textContent || btn.getAttribute('aria-label') || '').toLowerCase().trim();
            const goodLabels = ['dismiss', 'skip', 'not now', 'maybe later', 'no thanks', 
                              'later', 'cancel', 'close', 'got it', 'ok'];
            
            if (goodLabels.some(g => label.includes(g))) {
                btn.click();
                CLICKED.add(btn);
            }
        }
    }
    
    // ===== YOUTUBE PREMIUM / TRIAL VIDS =====
    // "Try YouTube Premium" / "Skip trial" buttons
    function handleTrialOffers() {
        const trialBtns = document.querySelectorAll('button, div[role="button"]');
        
        for (const btn of trialBtns) {
            if (CLICKED.has(btn)) continue;
            const text = (btn.textContent || '').toLowerCase().trim();
            
            // Patterns to skip/dismiss
            if (text === 'skip trial' || text === 'skip' || 
                text === 'not now' || text === 'no thanks' ||
                (text.includes('skip') && (text.includes('trial') || text.includes('ad')))) {
                
                btn.click();
                CLICKED.add(btn);
            }
        }
    }
    
    // ===== MUTATION OBSERVER =====
    function scan() {
        closeOverlays();
        dismissDialogs();
        handleTrialOffers();
    }
    
    const observer = new MutationObserver(function() {
        requestAnimationFrame ? requestAnimationFrame(scan) : setTimeout(scan, 0);
    });
    
    function init() {
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        observer.observe(document.body, { childList: true, subtree: true });
        scan();
        console.log('[YTSkip-ISOLATED] Initialized');
    }
    
    init();
    setInterval(scan, 3000);

})();
