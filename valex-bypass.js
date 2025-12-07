(function() {
    'use strict';

    const host = location.hostname;

    // Route to appropriate handler
    if (host.includes("valex.io")) {
        handleValex();
    } else if (host.includes("work.ink")) {
        handleWorkInk();
    }

    // ============================================
    // VALEX HANDLER
    // ============================================
    function handleValex() {
        const COLORS = {
            info: 'color: #00ff00; font-weight: bold; font-size: 13px',
            error: 'color: #ff0000; font-weight: bold; font-size: 13px',
            success: 'color: #00ffff; font-weight: bold; font-size: 13px',
        };

        let statusBox = null;

        const createStatusBox = () => {
            if (statusBox) return statusBox;

            statusBox = document.createElement('div');
            statusBox.id = 'valex-status-box';
            statusBox.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 25px;
                border-radius: 12px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                z-index: 999999;
                box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                min-width: 250px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
            `;
            document.body.appendChild(statusBox);
            return statusBox;
        };

        const updateStatusBox = (content) => {
            const box = createStatusBox();
            box.innerHTML = content;
        };

        const setupAntiDetection = () => {
            const suspiciousVars = [
                'LUPERLY', 'bypassCheckpoint', 'autoSolve', 'keySystemBypass',
                'fakeReferrer', 'spoofReferrer', 'checkpointBypass'
            ];

            suspiciousVars.forEach(varName => {
                try {
                    delete window[varName];
                    delete window[varName.toLowerCase()];
                    delete window[varName.toUpperCase()];
                } catch(e) {}
            });

            if (window.console._log) delete window.console._log;
            if (window.console._originalLog) delete window.console._originalLog;

            const nativeToString = Function.prototype.toString;
            const fakeNative = function() {
                if (this === Function.prototype.toString) {
                    return 'function toString() { [native code] }';
                }
                return nativeToString.apply(this, arguments);
            };

            try {
                Object.defineProperty(Function.prototype, 'toString', {
                    value: fakeNative,
                    writable: true,
                    configurable: true
                });
            } catch(e) {}
        };

        setupAntiDetection();

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const generateIntegrityHash = (step, progress, timestamp) => {
            const SYSTEM_SALT = "valex_ks_2024_" + window.location.origin;
            const data = `${step}:${progress}:${timestamp}:${SYSTEM_SALT}`;
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                hash = (hash << 5) - hash + data.charCodeAt(i);
                hash &= hash;
            }
            return hash.toString(36);
        };

        const updateStorage = (step, progress) => {
            const timestamp = Date.now();
            const hash = generateIntegrityHash(step, progress, timestamp);

            sessionStorage.setItem('keySystemStep', step.toString());
            sessionStorage.setItem('keySystemProgress', progress.toString());
            sessionStorage.setItem('keySystemIntegrityTs', timestamp.toString());
            sessionStorage.setItem('keySystemIntegrityHash', hash);
        };

        const findCheckpointButton = () => {
            const buttons = document.querySelectorAll('button');
            for (let btn of buttons) {
                const text = btn.textContent.trim();
                if (text.includes('Complete Checkpoint') || text.includes('Complete checkpoint')) {
                    return btn;
                }
            }
            return null;
        };

        const updateValexStatus = (status, step = null, message = '') => {
            const currentStep = step !== null ? step : parseInt(sessionStorage.getItem('keySystemStep') || '0');
            const progress = currentStep === 0 ? 0 : currentStep === 1 ? 50 : currentStep === 2 ? 100 : 100;

            let statusEmoji = '⏳';
            let statusColor = '#ffa500';

            if (status === 'complete') {
                statusEmoji = '✅';
                statusColor = '#00ff00';
            } else if (status === 'error') {
                statusEmoji = '❌';
                statusColor = '#ff0000';
            } else if (status === 'processing') {
                statusEmoji = '🔄';
                statusColor = '#00bfff';
            }

            updateStatusBox(`
                <div style="text-align: center;">
                    <div style="font-size: 14px; margin-bottom: 12px;">
                        🔓 Valex + Work.ink Bypass
                    </div>
                    <div style="font-size: 13px; margin-bottom: 10px; color: ${statusColor};">
                        ${statusEmoji} ${status.toUpperCase()}
                    </div>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin: 10px 0;">
                        <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">
                            Progress
                        </div>
                        <div style="font-size: 24px; font-weight: bold; color: #fff;">
                            ${currentStep}/3
                        </div>
                        <div style="width: 100%; background: rgba(0,0,0,0.3); height: 6px; border-radius: 3px; margin-top: 8px; overflow: hidden;">
                            <div style="width: ${progress}%; background: linear-gradient(90deg, #00ff00, #00bfff); height: 100%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                    ${message ? `<div style="font-size: 11px; opacity: 0.7; margin-top: 8px;">${message}</div>` : ''}
                </div>
            `);
        };

        const completeCheckpoint = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('token');

            if (tokenFromUrl) {
                console.log('%c[Valex] Token detected from Work.ink:', COLORS.success, tokenFromUrl);
                sessionStorage.setItem('workinkToken', tokenFromUrl);

                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('token');
                window.history.replaceState({}, '', newUrl.toString());
            }

            const workinkToken = sessionStorage.getItem('workinkToken');
            const linkOpened = sessionStorage.getItem('keySystemLinkOpened');
            const openTimestamp = parseInt(sessionStorage.getItem('keySystemLinkOpenTimestamp') || '0');
            const timeSpent = Date.now() - openTimestamp;

            const lastVisited = localStorage.getItem('lastLinkVisited') || '';
            const isReturningFromCheckpoint = lastVisited.includes('work.ink');

            if (workinkToken || (linkOpened === 'true' && isReturningFromCheckpoint && timeSpent >= 15000)) {
                const currentStep = parseInt(sessionStorage.getItem('keySystemStep') || '0');

                updateValexStatus('processing', currentStep, 'Completing checkpoint...');

                try {
                    const navToken = sessionStorage.getItem(`keySystemNavToken_${currentStep}`) || `nav_${Date.now()}`;
                    const challenge = sessionStorage.getItem(`keySystemChallenge_${currentStep}`) || `challenge_${Date.now()}`;

                    console.log('%c[Valex] Completing with token:', COLORS.info, workinkToken);

                    const response = await fetch('/api/key-system/checkpoint', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-key-scope': window.location.hostname.includes('ext') ? 'ext' : 'key',
                            'Accept': 'application/json'
                        },
                        cache: 'no-store',
                        body: JSON.stringify({
                            action: 'complete',
                            stepIndex: currentStep,
                            token: workinkToken,
                            navigationToken: navToken,
                            clientReferrer: 'https://work.ink/',
                            challenge: challenge
                        })
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        sessionStorage.removeItem('workinkToken');
                        localStorage.removeItem('lastLinkVisited');
                        localStorage.removeItem('lastLinkVisitTime');

                        const newStep = currentStep + 1;
                        const newProgress = newStep === 1 ? 50 : newStep === 2 ? 100 : 0;
                        updateStorage(newStep, newProgress);

                        if (newStep >= 3) {
                            updateValexStatus('complete', 3, 'All checkpoints done! Reloading...');
                            await sleep(2000);
                            window.location.reload();
                            return true;
                        }

                        updateValexStatus('complete', newStep, 'Checkpoint completed! Reloading...');
                        await sleep(3000);
                        window.location.reload();
                        return true;
                    } else {
                        updateValexStatus('error', currentStep, result.message || 'Failed to complete');
                    }
                } catch (error) {
                    updateValexStatus('error', null, error.message);
                }
            }

            return false;
        };

        const clickCheckpointButton = async () => {
            const button = findCheckpointButton();

            if (!button) {
                const allComplete = sessionStorage.getItem('keySystemAllCheckpointsComplete');
                if (allComplete === 'true') {
                    updateValexStatus('complete', 3, 'Complete Turnstile captcha');
                    return;
                }

                updateValexStatus('waiting', null, 'Looking for button...');
                await sleep(2000);
                return clickCheckpointButton();
            }

            if (button.disabled) {
                updateValexStatus('waiting', null, 'Button disabled, waiting...');
                await sleep(1000);
                return clickCheckpointButton();
            }

            const currentStep = parseInt(sessionStorage.getItem('keySystemStep') || '0');

            updateValexStatus('processing', currentStep, `Clicking checkpoint ${currentStep + 1}...`);

            await sleep(2000);

            // Mark that we're opening the link
            sessionStorage.setItem('keySystemLinkOpened', 'true');
            sessionStorage.setItem('keySystemLinkOpenTimestamp', Date.now().toString());

            button.click();

            updateValexStatus('processing', currentStep, 'Redirecting to Work.ink...');
        };

        const handleMainPage = async () => {
            console.log('%c[Valex] Starting handler...', COLORS.info);

            const currentStep = parseInt(sessionStorage.getItem('keySystemStep') || '0');
            updateValexStatus('waiting', currentStep, 'Initializing...');

            const completed = await completeCheckpoint();

            if (!completed) {
                updateValexStatus('waiting', currentStep, 'Ready to start...');
                await sleep(2000);
                await clickCheckpointButton();
            }
        };

        const init = async () => {
            console.log('%c=== Valex Auto Bypass ===', COLORS.info);
            await sleep(1000);
            setupAntiDetection();
            await handleMainPage();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    // ============================================
    // WORK.INK HANDLER (FULL BYPASS)
    // ============================================
    function handleWorkInk() {
        console.log('%c[Work.ink] Bypass activated', 'color: #00ff00; font-weight: bold;');

        let sessionController = undefined;
        let sendMessage = undefined;
        let LinkInfo = undefined;
        let LinkDestination = undefined;
        let bypassTriggered = false;
        let destinationReceived = false;
        let destinationProcessed = false;

        const map = {
            onLI: ["onLinkInfo"],
            onLD: ["onLinkDestination"]
        };

        const types = {
            an: 'c_announce',
            mo: 'c_monetization',
            ss: 'c_social_started',
            rr: 'c_recaptcha_response',
            hr: 'c_hcaptcha_response',
            tr: 'c_turnstile_response',
            ad: 'c_adblocker_detected',
            fl: 'c_focus_lost',
            os: 'c_offers_skipped',
            ok: 'c_offer_skipped',
            fo: 'c_focus',
            wp: 'c_workink_pass_available',
            wu: 'c_workink_pass_use',
            pi: 'c_ping',
            kk: 'c_keyapp_key',
            mc: 'c_monocle',
            bd: 'c_bot_detected'
        };

        function getName(obj, candidates = null) {
            if (!obj || typeof obj !== "object") {
                return { fn: null, index: -1, name: null };
            }

            if (candidates) {
                for (let i = 0; i < candidates.length; i++) {
                    const name = candidates[i];
                    if (typeof obj[name] === "function") {
                        return { fn: obj[name], index: i, name };
                    }
                }
            } else {
                for (let i in obj) {
                    if (typeof obj[i] == "function" && obj[i].length == 2) {
                        return { fn: obj[i], name: i };
                    }
                }
            }
            return { fn: null, index: -1, name: null };
        }

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function triggerBypass(reason) {
            if (bypassTriggered) return;
            bypassTriggered = true;
            console.log('[Work.ink] Triggering bypass via:', reason);
            spoofWorkink();
        }

        function injectBrowserExtensionSupport() {
            if (window._browserExtBypassInjected) return;

            if (!window.chrome) window.chrome = {};
            if (!window.chrome.runtime) window.chrome.runtime = {};

            const originalSendMessage = window.chrome.runtime.sendMessage;
            window.chrome.runtime.sendMessage = function(extensionId, message, callback) {
                if (message?.message === 'wk_installed') {
                    if (callback) callback({ installed: true });
                    return;
                }
                if (originalSendMessage) {
                    return originalSendMessage.apply(this, arguments);
                }
            };

            window._browserExtBypassInjected = true;
        }

        async function spoofWorkink() {
            if (!LinkInfo) return;

            injectBrowserExtensionSupport();

            const socials = LinkInfo.socials || [];
            console.log('[Work.ink] Total Socials:', socials.length);

            if (socials.length > 0) {
                for (let i = 0; i < socials.length; i++) {
                    const soc = socials[i];
                    try {
                        if (sendMessage && sessionController) {
                            const payload = { url: soc.url };
                            if (sessionController.websocket && sessionController.websocket.readyState === WebSocket.OPEN) {
                                sendMessage.call(sessionController, types.ss, payload);
                                console.log('[Work.ink] Social bypassed:', payload);
                            }
                        }
                    } catch (e) {
                        console.error('[Work.ink] Social bypass failed:', e);
                    }
                }
            }

            await handleMonetizations();
        }

        async function handleMonetizations() {
            const nodes = sessionController?.monetizations || [];
            console.log('[Work.ink] Total monetizations:', nodes.length);

            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];

                try {
                    const nodeId = node.id;
                    const nodeSendMessage = node.sendMessage;

                    console.log('[Work.ink] Processing ID:', nodeId);

                    switch (nodeId) {
                        case 22: // Announcement
                            nodeSendMessage.call(node, { event: 'read' });
                            await sleep(500);
                            if (typeof node.setDone === 'function') {
                                node.setDone();
                            } else {
                                nodeSendMessage.call(node, { event: 'done' });
                            }
                            break;

                        case 23: // Installer
                        case 27: // Buff Desktop
                        case 28: // Buff Mobile
                        case 32: // Nord VPN
                        case 34: // Norton Antivirus
                        case 40: // Install App
                        case 60: // LDPlayer
                        case 62: // On That Ass
                        case 65: // Lenme
                        case 70: // Gauthai
                        case 71: // External Articles
                            nodeSendMessage.call(node, { event: 'start' });
                            await sleep(300);
                            nodeSendMessage.call(node, { event: 'installClicked' });
                            await sleep(500);
                            if (typeof node.setDone === 'function') {
                                node.setDone();
                            } else {
                                nodeSendMessage.call(node, { event: 'done' });
                            }
                            break;

                        case 25: // Opera GX
                            nodeSendMessage.call(node, { event: 'start' });
                            await sleep(300);
                            nodeSendMessage.call(node, { event: 'installClicked' });

                            fetch('/_api/v2/affiliate/operaGX', { method: 'GET', mode: 'no-cors' }).catch(() => {});
                            setTimeout(() => {
                                fetch('https://work.ink/_api/v2/callback/operaGX', {
                                    method: 'POST',
                                    mode: 'no-cors',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ noteligible: true })
                                }).catch(() => {});
                            }, 2000);

                            await sleep(3000);
                            if (typeof node.setDone === 'function') {
                                node.setDone();
                            } else {
                                nodeSendMessage.call(node, { event: 'done' });
                            }
                            break;

                        case 29: // Browser Extension 2
                        case 36: // Lume Browser Android
                        case 57: // BetterDeals Extension
                            nodeSendMessage.call(node, { event: 'installed' });
                            await sleep(500);
                            if (typeof node.setDone === 'function') {
                                node.setDone();
                            } else {
                                nodeSendMessage.call(node, { event: 'done' });
                            }
                            break;

                        default:
                            console.log('[Work.ink] Unknown monetization ID:', nodeId);
                            nodeSendMessage.call(node, { event: 'read' });
                            await sleep(200);
                            nodeSendMessage.call(node, { event: 'start' });
                            await sleep(200);
                            nodeSendMessage.call(node, { event: 'installClicked' });
                            await sleep(200);
                            nodeSendMessage.call(node, { event: 'installed' });
                            await sleep(200);
                            if (typeof node.setDone === 'function') {
                                node.setDone();
                            } else {
                                nodeSendMessage.call(node, { event: 'done' });
                            }
                            break;
                    }

                    console.log('[Work.ink] Completed ID:', nodeId);
                } catch (e) {
                    console.error('[Work.ink] Failed to process node:', node.id, e);
                }
            }

            console.log('[Work.ink] All monetizations bypassed');
        }

        function createSendMessage() {
            return function (...args) {
                const packet_type = args[0];
                const packet_data = args[1];

                if (packet_type !== types.pi) {
                    console.log('[Work.ink] Message sent:', packet_type, packet_data);
                }

                const captchaResponses = [types.tr, types.hr, types.rr];
                for (let i = 0; i < captchaResponses.length; i++) {
                    const captchaResponse = captchaResponses[i];
                    if (packet_type === captchaResponse) {
                        triggerBypass('captcha');
                        if (document.head) document.head.remove();
                        if (document.body) document.body.remove();
                    }
                }

                return sendMessage.apply(this, args);
            };
        }

        function createLinkInfo() {
            return async function (...args) {
                const [info] = args;
                LinkInfo = info;
                console.log('[Work.ink] Link info:', info);

                spoofWorkink();

                try {
                    Object.defineProperty(info, 'isAdblockEnabled', {
                        get: () => false,
                        set: () => {},
                        configurable: false,
                        enumerable: true
                    });
                } catch (e) {
                    console.error('[Work.ink] Failed to override adblock:', e);
                }

                return LinkInfo ? LinkInfo.apply(this, args) : undefined;
            };
        }

        function redirect(url) {
            // Extract destination URL and redirect back to Valex with token
            console.log('[Work.ink] Redirecting to:', url);
            window.location.href = url;
        }

        function startCountdown(url, waitLeft) {
            console.log('[Work.ink] Starting countdown:', waitLeft, 'seconds');
            const interval = setInterval(() => {
                waitLeft -= 1;
                if (waitLeft > 0) {
                    console.log('[Work.ink] Countdown:', waitLeft);
                } else {
                    clearInterval(interval);
                    redirect(url);
                }
            }, 1000);
        }

        function createLinkDestination() {
            return async function (...args) {
                const [data] = args;
                destinationReceived = true;
                console.log("[Work.ink] Destination received:", data);

                let waitTimeSeconds = 3;

                if (!destinationProcessed) {
                    destinationProcessed = true;
                    if (waitTimeSeconds <= 0) {
                        redirect(data.url);
                    } else {
                        startCountdown(data.url, waitTimeSeconds);
                    }
                }

                return LinkDestination ? LinkDestination.apply(this, args) : undefined;
            };
        }

        function setupProxies() {
            const send = getName(sessionController);
            const info = getName(sessionController, map.onLI);
            const dest = getName(sessionController, map.onLD);

            if (!send.fn || !info.fn || !dest.fn) return;

            console.log('[Work.ink] Methods found:', { send: send.name, info: info.name, dest: dest.name });

            sendMessage = send.fn;
            LinkInfo = info.fn;
            LinkDestination = dest.fn;

            try {
                Object.defineProperty(sessionController, send.name, {
                    get: createSendMessage,
                    set: v => (sendMessage = v),
                    configurable: true
                });
                Object.defineProperty(sessionController, info.name, {
                    get: createLinkInfo,
                    set: v => (LinkInfo = v),
                    configurable: true
                });
                Object.defineProperty(sessionController, dest.name, {
                    get: createLinkDestination,
                    set: v => (LinkDestination = v),
                    configurable: true
                });
            } catch (e) {
                console.error('[Work.ink] Failed to setup proxies:', e);
            }
        }

        function checkController(target, prop, value) {
            if (value &&
                typeof value === 'object' &&
                getName(value).fn &&
                getName(value, map.onLI).fn &&
                getName(value, map.onLD).fn &&
                !sessionController
            ) {
                sessionController = value;
                setupProxies();
                console.log('[Work.ink] Controller detected');
            }
            return Reflect.set(target, prop, value);
        }

        function createComponentProxy(comp) {
            return new Proxy(comp, {
                construct(target, args) {
                    const instance = Reflect.construct(target, args);
                    if (instance.$$.ctx) {
                        instance.$$.ctx = new Proxy(instance.$$.ctx, { set: checkController });
                    }
                    return instance;
                }
            });
        }

        function createNodeProxy(node) {
            return async (...args) => {
                const result = await node(...args);
                return new Proxy(result, {
                    get: (t, p) => p === 'component' ? createComponentProxy(t.component) : Reflect.get(t, p)
                });
            };
        }

        function createKitProxy(kit) {
            if (!kit?.start) return [false, kit];
            return [
                true,
                new Proxy(kit, {
                    get(target, prop) {
                        if (prop === 'start') {
                            return function (...args) {
                                const [nodes, , opts] = args;
                                if (nodes?.nodes && opts?.node_ids) {
                                    const idx = opts.node_ids[1];
                                    if (nodes.nodes[idx]) {
                                        nodes.nodes[idx] = createNodeProxy(nodes.nodes[idx]);
                                    }
                                }
                                return kit.start.apply(this, args);
                            };
                        }
                        return Reflect.get(target, prop);
                    }
                })
            ];
        }

        function setupInterception() {
            const origPromiseAll = Promise.all;
            let intercepted = false;

            Promise.all = async function (promises) {
                const result = origPromiseAll.call(this, promises);
                if (!intercepted) {
                    return await new Promise((resolve) => {
                        result.then(([kit, app, ...args]) => {
                            const [success, created] = createKitProxy(kit);
                            if (success) {
                                intercepted = true;
                                Promise.all = origPromiseAll;
                                console.log('[Work.ink] Kit intercepted');
                            }
                            resolve([created, app, ...args]);
                        });
                    });
                }
                return await result;
            };
        }

        // Block ads
        window.googletag = { cmd: [], _loaded_: true };

        const blockedClasses = [
            "adsbygoogle", "adsense-wrapper", "inline-ad", "gpt-billboard-container",
            "[&:not(:first-child)]:mt-12", "lg:block", "linkcard", "linklist",
            "svelte-1xnqd8c", "svelte-1ao8oou", "svelte-1i15zsk",
            "qc-cmp2-container", "roundedDotChatButton"
        ];

        const blockedIds = [
            "billboard-1", "billboard-2", "billboard-3",
            "sidebar-ad-1", "skyscraper-ad-1"
        ];

        setupInterception();

        const ob = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        blockedClasses.forEach((cls) => {
                            if (node.classList?.contains(cls)) {
                                node.remove();
                            }
                            node.querySelectorAll?.(`.${CSS.escape(cls)}`).forEach((el) => {
                                el.remove();
                            });
                        });

                        blockedIds.forEach((id) => {
                            if (node.id === id) {
                                node.remove();
                            }
                            node.querySelectorAll?.(`#${id}`).forEach((el) => {
                                el.remove();
                            });
                        });

                        // Auto-click destination button
                        if (node.matches('.button.large.accessBtn.pos-relative') && node.textContent.includes('Go To Destination')) {
                            node.click();
                        } else {
                            node.querySelectorAll?.('.button.large.accessBtn.pos-relative').forEach(btn => {
                                if (btn.textContent.includes('Go To Destination')) {
                                    btn.click();
                                }
                            });
                        }
                    }
                }
            }
        });

        ob.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    }

})();
