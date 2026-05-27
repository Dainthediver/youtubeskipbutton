// ==========================================
// YT Skip Button v3.0 - content-main.js
// Runs in MAIN world via content_scripts with "world": "MAIN"
// Direct page-level access to YouTube's global scope
// ==========================================
(function() {
    'use strict';
    
    if (window.__ytSkipMainWorld__) return;
    window.__ytSkipMainWorld__ = true;

    // ===== PATCH #1: isTrusted bypass =====
    // Must happen before any YouTube scripts load
    const eventProtos = [Event, UIEvent, MouseEvent, PointerEvent, KeyboardEvent, FocusEvent, InputEvent];
    
    for (const Evt of eventProtos) {
        if (!Evt || !Evt.prototype) continue;
        try {
            Object.defineProperty(Evt.prototype, 'isTrusted', {
                get() { return true; },
                configurable: true,
                enumerable: true
            });
        } catch(e) {}
    }

    // ===== PATCH #2: Override Event constructors =====
    const _origEvent = window.Event;
    const _origMouseEvent = window.MouseEvent;
    const _origPointerEvent = window.PointerEvent;
    
    function makeTrusted(Original) {
        return function(type, init) {
            const e = new Original(type, init);
            try {
                Object.defineProperty(e, 'isTrusted', { value: true, configurable: false, writable: false });
            } catch(err) {}
            return e;
        };
    }
    
    try { window.Event = makeTrusted(_origEvent); } catch(e) {}
    try { window.MouseEvent = makeTrusted(_origMouseEvent); } catch(e) {}
    try { window.PointerEvent = makeTrusted(_origPointerEvent); } catch(e) {}

    // ===== PATCH #3: Hook YouTube's player dispatch =====
    // Intercept yt_*.calls.dispatcher or similar event dispatch
    const origAddEventListener = EventTarget.prototype.addEventListener;
    
    EventTarget.prototype.addEventListener = function(type, handler, options) {
        if (type === 'click' && this.nodeType === 1) {
            const cls = this.className || '';
            // Check if this is the skip button
            if (cls.includes('skip') || cls.includes('ytp-ad')) {
                console.log('[YTSkip] Patching click listener on skip button');
                // Wrap handler to inject isTrusted = true check bypass
                const wrapped = function(event) {
                    try {
                        Object.defineProperty(event, 'isTrusted', { value: true, configurable: true });
                    } catch(e) {}
                    return handler.call(this, event);
                };
                return origAddEventListener.call(this, type, wrapped, options);
            }
        }
        return origAddEventListener.call(this, type, handler, options);
    };

    // ===== PATCH #4: Continuous video ad fast-forward =====
    let lastFF = 0;
    
    function fastForwardAd() {
        if (Date.now() - lastFF < 200) return; // 5x/sec max
        lastFF = Date.now();
        
        const videos = document.querySelectorAll('video');
        for (const video of videos) {
            if (!video || !video.duration || video.duration === Infinity) continue;
            if (video.paused && !video.ended) continue;
            
            const container = video.closest && video.closest('#movie_player, .html5-video-player, ytd-player');
            const hasAdOverlay = container && container.querySelector(
                '.ad-showing, .ytp-ad-player-overlay,' +
                '.ytp-ad-skip-button-slot, .ytp-skip-ad-button, .ytp-ad-progress'
            );
            
            const isShortAd = video.duration < 60;
            const isEarlyInAd = video.currentTime < video.duration - 1;
            
            if ((hasAdOverlay || (isShortAd && isEarlyInAd && !video.paused))) {
                try {
                    video.currentTime = Math.max(0, video.duration - 0.5);
                    if (!video.paused) {
                        video.playbackRate = 16;
                    }
                    console.log('[YTSkip] Main: FF ad video');
                } catch(e) {}
            }
        }
    }

    // ===== PATCH #5: Skip button finder =====
    const CLICKED = new WeakSet();
    
    const SKIP_SELECTORS = [
        '.ytp-ad-skip-button-slot button',   // Latest (May 2026)
        '.ytp-skip-ad-button',                // New 2026
        '.ytp-ad-skip-button',                // Classic
        '.ytp-ad-skip-button-modern',         // Modern variant
        'button[class*="skip-ad"]',
        'button[class*="skip-button"]',
    ];
    
    function isVisible(el) {
        if (!el) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0;
    }

    function clickSkips() {
        for (const sel of SKIP_SELECTORS) {
            try {
                for (const el of document.querySelectorAll(sel)) {
                    if (CLICKED.has(el)) continue;
                    if (!isVisible(el)) continue;
                    
                    // Force isTrusted before click
                    const fakeEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
                    Object.defineProperty(fakeEvent, 'isTrusted', { value: true, configurable: true });
                    
                    el.dispatchEvent(fakeEvent);
                    el.click();
                    CLICKED.add(el);
                    
                    console.log('[YTSkip] Main clicked:', sel);
                    return true;
                }
            } catch(e) {}
        }
        return false;
    }
    
    function findByText() {
        const all = document.querySelectorAll('button, div[role="button"]');
        for (const btn of all) {
            if (CLICKED.has(btn)) continue;
            const text = (btn.textContent || '').toLowerCase().trim();
            if (text === 'skip' || text === 'skip ad' || (text.includes('skip') && text.includes('ad'))) {
                if (!isVisible(btn)) continue;
                btn.click();
                CLICKED.add(btn);
                return true;
            }
        }
        return false;
    }
    
    // ===== OBSERVER: WATCH FOR ADS =====
    function onDomChange() {
        try {
            fastForwardAd();
            if (!clickSkips()) findByText();
        } catch(e) {}
    }
    
    const observer = new MutationObserver(function() {
        onDomChange();
    });
    
    function init() {
        if (!document.body) {
            setTimeout(init, 50);
            return;
        }
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[YTSkip] Main world initialized');
        onDomChange();
    }
    
    init();

})();
