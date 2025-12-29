(function() {
    'use strict';

    function extractDestination(url) {
        try {
            const urlObj = new URL(url);
            const destination = urlObj.searchParams.get('source_target_domain');
            return destination || null;
        } catch (e) {
            console.error('[TiRex] Error parsing URL:', e);
            return null;
        }
    }

    function findLockrLinks() {
        const links = [];

        const selectors = [
            'a[href*="lockr.so/subscriptions"]',
            'a[href*="lockr.so"]',
            'a.premium_unlock_btn',
            'a[data-overlay]'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const href = el.href || el.getAttribute('href');
                if (href && href.includes('lockr.so')) {
                    const destination = extractDestination(href);
                    if (destination) {
                        links.push({ url: href, destination });
                    }
                }
            });
        });

        return links;
    }

    function createUI() {
        const existing = document.getElementById('tirex-extractor');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.id = 'tirex-extractor';
        container.innerHTML = `
            <style>
                #tirex-extractor * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                #tirex-extractor {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #000000;
                    border: 1px solid #2a2a2a;
                    border-radius: 8px;
                    width: 450px;
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.9);
                    overflow: hidden;
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -45%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }

                #tirex-extractor .header {
                    background: #0a0a0a;
                    padding: 15px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid #1a1a1a;
                }

                #tirex-extractor .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                #tirex-extractor .header-title {
                    display: flex;
                    flex-direction: column;
                }

                #tirex-extractor .app-name {
                    color: #ffffff;
                    font-size: 16px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                #tirex-extractor .app-version {
                    color: #666;
                    font-size: 11px;
                    margin-top: 2px;
                }

                #tirex-extractor .header-controls {
                    display: flex;
                    gap: 8px;
                }

                #tirex-extractor .header-btn {
                    width: 32px;
                    height: 32px;
                    background: transparent;
                    border: 1px solid #2a2a2a;
                    border-radius: 4px;
                    color: #ffffff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    transition: all 0.2s;
                }

                #tirex-extractor .header-btn:hover {
                    background: #1a1a1a;
                    border-color: #3a3a3a;
                }

                #tirex-extractor .content {
                    padding: 30px;
                }

                #tirex-extractor .status-bar {
                    background: #0a0a0a;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 12px 16px;
                    color: #ffffff;
                    font-size: 13px;
                    margin-bottom: 30px;
                    font-family: 'Courier New', monospace;
                }

                #tirex-extractor .main-section {
                    text-align: center;
                    padding: 20px 0;
                }

                #tirex-extractor .hourglass {
                    font-size: 64px;
                    margin-bottom: 20px;
                    animation: rotate 2s ease-in-out infinite;
                }

                @keyframes rotate {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(180deg); }
                }

                #tirex-extractor .main-title {
                    color: #ffffff;
                    font-size: 22px;
                    font-weight: 600;
                    margin-bottom: 12px;
                }

                #tirex-extractor .main-subtitle {
                    color: #999;
                    font-size: 14px;
                    margin-bottom: 30px;
                }

                #tirex-extractor .footer-text {
                    color: #666;
                    font-size: 12px;
                    font-style: italic;
                    text-align: center;
                }

                #tirex-extractor .result-section {
                    display: none;
                }

                #tirex-extractor .result-section.show {
                    display: block;
                }

                #tirex-extractor .result-field {
                    margin-bottom: 15px;
                }

                #tirex-extractor .result-label {
                    color: #999;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                    display: block;
                }

                #tirex-extractor .result-input {
                    width: 100%;
                    padding: 12px;
                    background: #0a0a0a;
                    border: 1px solid #2a2a2a;
                    border-radius: 6px;
                    color: #ffffff;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                }

                #tirex-extractor .button-group {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 20px;
                }

                #tirex-extractor .action-btn {
                    padding: 12px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                #tirex-extractor .btn-copy {
                    background: #0e0e0e;
                    color: #ffffff;
                }

                #tirex-extractor .btn-copy:hover {
                    background: #0f0f0f;
                }

                #tirex-extractor .btn-redirect {
                    background: #0e0e0e;
                    color: #ffffff;
                }

                #tirex-extractor .btn-redirect:hover {
                    background: #0f0f0f;
                }

                #tirex-extractor .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.85);
                    z-index: 999998;
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            </style>

            <div class="header">
                <div class="header-left">
                    <div class="header-title">
                        <div class="app-name">TiRex</div>
                        <div class="app-version">v1.0.0</div>
                    </div>
                </div>
                <div class="header-controls">
                    <button class="header-btn" id="minimize-btn">−</button>
                    <button class="header-btn" id="close-btn">×</button>
                </div>
            </div>

            <div class="content">
                <div class="result-section show" id="result-section">
                    <div class="result-field">
                        <label class="result-label">Destination Link</label>
                        <input type="text" class="result-input" id="destination-url" readonly>
                    </div>
                    <div class="button-group">
                        <button class="action-btn btn-copy" id="copy-btn">Copy Link</button>
                        <button class="action-btn btn-redirect" id="redirect-btn">Go to Link</button>
                    </div>
                </div>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'tirex-overlay';

        document.body.appendChild(overlay);
        document.body.appendChild(container);

        const resultSection = container.querySelector('#result-section');
        const initialInput = container.querySelector('#initial-url');
        const destinationInput = container.querySelector('#destination-url');
        const copyBtn = container.querySelector('#copy-btn');
        const redirectBtn = container.querySelector('#redirect-btn');
        const minimizeBtn = container.querySelector('#minimize-btn');
        const closeBtn = container.querySelector('#close-btn');

        let destination = null;
        let originalUrl = null;

        setTimeout(() => {
            const links = findLockrLinks();
            if (links.length > 0) {
                originalUrl = links[0].url;
                destination = links[0].destination;
                showResults();
                console.log('[TiRex] Link found:', { originalUrl, destination });
            }
        });

        function showResults() {
            resultSection.classList.add('show');

            if (destination) {
                destinationInput.value = destination;

                copyBtn.addEventListener('click', () => {
                    GM_setClipboard(destination);
                    copyBtn.textContent = '✓ Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy Link';
                    }, 1500);
                });

                redirectBtn.addEventListener('click', () => {
                    window.location.href = destination;
                });
            } else {
                initialInput.value = 'No Lockr links found';
                destinationInput.value = 'N/A';
                copyBtn.disabled = true;
                redirectBtn.disabled = true;
            }
        }

        let minimized = false;
        minimizeBtn.addEventListener('click', () => {
            minimized = !minimized;
            container.style.display = minimized ? 'none' : 'block';
        });

        const closeUI = () => {
            container.remove();
            overlay.remove();
        };

        closeBtn.addEventListener('click', closeUI);
        overlay.addEventListener('click', closeUI);

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeUI();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    let uiShown = false;

    function checkAndShowUI() {
        if (uiShown) return;

        const links = findLockrLinks();
        if (links.length > 0) {
            console.log(`[TiRex] Detected ${links.length} Lockr link(s)`);
            uiShown = true;
            createUI();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(checkAndShowUI, 1000);
        });
    } else {
        setTimeout(checkAndShowUI, 1000);
    }

    const observer = new MutationObserver(() => {
        checkAndShowUI();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    GM_registerMenuCommand('Show TiRex', () => {
        uiShown = false;
        createUI();
    });

})();
