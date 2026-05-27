// ==========================================
// YT Skip Button v3.0 - injected.js
// Injected via <script> into page for HIGHEST privilege
// Runs before YouTube's player scripts load
// ==========================================
(function() {
    'use strict';
    
    if (window.__ytSkipInjected__) return;
    window.__ytSkipInjected__ = true;

    // ===== OVERRIDE isTrusted ACROSS ALL EVENTS =====
    const eventProtos = [Event, UIEvent, MouseEvent, PointerEvent, FocusEvent, KeyboardEvent];
    
    for (const Evt of eventProtos) {
        if (!Evt || !Evt.prototype) continue;
        try {
            Object.defineProperty(Evt.prototype, 'isTrusted', {
                get() { return true; },
                configurable: true,
                enumerable: true
            });
        } catch(e) { console.warn('[YTSkip] isTrusted override failed for', Evt.name, e); }
    }
    
    // ===== INTERCEPT ALL EVENT CONSTRUCTORS =====
    // Force isTrusted = true on events built with new Event / new MouseEvent
    const _Event = window.Event;
    const _MouseEvent = window.MouseEvent;
    const _PointerEvent = window.PointerEvent;
    
    function wrapEvent(Original, name) {
        return function(type, init) {
            const evt = new Original(type, init);
            try {
                Object.defineProperty(evt, 'isTrusted', {
                    value: true,
                    writable: false,
                    configurable: false
                });
            } catch(e) {}
            return evt;
        };
    }
    
    try {
        window.Event = wrapEvent(_Event, 'Event');
        window.MouseEvent = wrapEvent(_MouseEvent, 'MouseEvent');
        window.PointerEvent = wrapEvent(_PointerEvent, 'PointerEvent');
    } catch(e) {
        console.warn('[YTSkip] Event constructor override failed:', e);
    }

    // ===== VIDEO FAST-FORWARD LOOP (AGGRESSIVE) =====
    // Continually check and fast-forward ad videos
    let ffTimer = setInterval(function() {
        const videos = document.querySelectorAll('video');
        
        for (const video of videos) {
            if (!video || video.duration <= 0 || video.duration === Infinity) continue;
            
            // Detect ad via parent containers and overlays
            const container = video.closest('#movie_player, .html5-video-player, ytd-player');
            const hasAdOverlay = container && container.querySelector(
                '.ad-showing, .ytp-ad-player-overlay, .ytp-ad-skip-button-slot,' +
                '.ytp-skip-ad-button, .ytp-ad-progress'
            );
            
            // Also detect ads by short duration + not being the main player
            const isShortAd = video.duration < 60;
            const isPlaying = !video.paused && video.currentTime > 0;
            
            if (hasAdOverlay || (isShortAd && isPlaying && video.currentTime < video.duration - 1)) {
                try {
                    video.currentTime = video.duration - 0.1;
                    video.playbackRate = 20;  // max allowed
                    console.log('[YTSkip] Fast-forwarded ad video');
                } catch(e) {}
            }
        }
    }, 250); // check 4x per second

    // ===== SKIP BUTTON DETECTION =====
    const CLICKED = new WeakSet();
    
    function isVisible(el) {
        if (!el) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }
    
    function findAndClickSkips() {
        const selectors = [
            '.ytp-ad-skip-button-slot button',
            '.ytp-skip-ad-button',
            '.ytp-ad-skip-button',
            '.ytp-ad-skip-button-modern',
            '.ytp-ad-skip-button-text',
            'button[class*="skip-ad"]',
            'button[class*="skip-button"]',
        ];
        
        for (const sel of selectors) {
            try {
                const elems = document.querySelectorAll(sel);
                for (const el of elems) {
                    if (CLICKED.has(el)) continue;
                    if (!isVisible(el)) continue;
                    
                    el.click();
                    CLICKED.add(el);
                    console.log('[YTSkip] Clicked skip button:', sel);
                    return true;
                }
            } catch(e) {}
        }
        
        // Fallback: scan all buttons, find one with "Skip" text
        const allButtons = document.querySelectorAll('button, div[role="button"]');
        for (const btn of allButtons) {
            if (CLICKED.has(btn)) continue;
            const text = (btn.textContent || '').trim().toLowerCase();
            if (text.includes('skip') || text.includes('skip ad')) {
                if (!isVisible(btn)) continue;
                
                // Simulate a REAL user click with pointer events
                ['pointerdown', 'mousedown', 'click', 'mouseup', 'pointerup'].forEach(type => {
                    try {
                        btn.dispatchEvent(new MouseEvent(type, {
                            view: window, bubbles: true, cancelable: true
                        }));
                    } catch(e) {}
                });
                
                btn.click();
                CLICKED.add(btn);
                console.log('[YTSkip] Found skip by text');
                return true;
            }
        }
        
        return false;
    }
    
    // ===== MUTATION OBSERVER =====
    const observer = new MutationObserver(function(mutations) {
        // Debounced check
        clearTimeout(observer._t);
        observer._t = setTimeout(findAndClickSkips, 50);
    });
    
    function startObserving() {
        if (!document.body) {
            setTimeout(startObserving, 50);
            return;
        }
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[YTSkip] Injected observer started');
    }
    
    startObserving();
    
    // Also run immediately
    findAndClickSkips();

    // ===== CLEANUP ON PAGE HIDE =====
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            clearInterval(ffTimer);
        }
    });

})();
