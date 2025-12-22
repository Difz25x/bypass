(function() {
    'use strict';

    const log = {
        stylePrefix: 'color: #ffac79ff; font-weight: bold; padding: 2px 5px; border-radius: 4px;',
        debug: (task, data = '') => {
            console.log(`%c[DEBUG]`, log.stylePrefix, task, data);
        },
        info: (task, data = '') => {
            console.log(`%c[INFO]`, log.stylePrefix, task, data);
        },
        error: (task, err = '') => {
            console.log(`%c[ERROR]`, log.stylePrefix, task, err);
        },
        method: (name, obj1, obj2) => {
            console.log(`%c[METHOD]`, log.stylePrefix, name, obj1, obj2);
        }
    };

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
                            window.location.reload();
                            return true;
                        }

                        updateValexStatus('complete', newStep, 'Checkpoint completed! Reloading...');
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
                await sleep(100);
                return clickCheckpointButton();
            }

            if (button.disabled) {
                updateValexStatus('waiting', null, 'Button disabled, waiting...');
                await sleep(100);
                return clickCheckpointButton();
            }

            const currentStep = parseInt(sessionStorage.getItem('keySystemStep') || '0');

            updateValexStatus('processing', currentStep, `Clicking checkpoint ${currentStep + 1}...`);

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
                await clickCheckpointButton();
            }
        };

        const init = async () => {
            console.log('%c=== Valex Auto Bypass ===', COLORS.info);
            setupAntiDetection();
            await handleMainPage();
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    function handleWorkInk() {
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

        log.debug('WebSocket status:', {
            exists: !!sessionController?.websocket,
            readyState: sessionController?.websocket?.readyState,
            url: sessionController?.websocket?.url
        });

        function triggerBypass(reason) {
            if (bypassTriggered) {
                return;
            }
            bypassTriggered = true;
            console.log('trigger Bypass via:', reason);
            function keepSpoofing() {
                if (destinationReceived) {
                    return;
                }
                spoofWorkink();
                setTimeout(keepSpoofing, 1000);
            }
            //keepSpoofing();
            spoofWorkink();
        }

        function spoofWorkink() {
            if (!sessionController.linkInfo){
                return;
            }

            const socials = sessionController.linkInfo.socials || [];
            log.info('Total Socials: ', socials.length)

            if (socials.length > 0) {
                (async () => {
                    for (let i = 0; i < socials.length; i++) {
                        const soc = socials[i];
                        try {
                            if (sendMessage && sessionController) {
                                const payload = { url: soc.url };
                                if (sessionController.websocket && sessionController.websocket.readyState === WebSocket.OPEN) {
                                    sendMessage.call(sessionController, types.ss, payload);
                                    log.debug('Social Bypassed: ', payload)
                                } else {
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    i--;
                                    continue;
                                }
                            }
                        } catch (e) {
                            log.error('Social bypass failed:', e);
                        }
                        if (i < socials.length) {
                           window.location.reload();
                        }
                    }
                })();
            } else {
                handleMonetizations();
            }

            function injectBrowserExtensionSupport() {
                if (window._browserExt2BypassInjected) return;

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

                window._browserExt2BypassInjected = true;
            }

            async function handleMonetizations() {
                injectBrowserExtensionSupport();
                const nodes = sessionController?.monetizations || [];

                log.info('Total monetizations:', nodes.length);

                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];

                    try {
                        const nodeId = node.id;
                        const nodeSendMessage = node.sendMessage;

                        log.info('Processing ID:', nodeId);

                        switch (nodeId) {
                            case 22: // Announcement
                                nodeSendMessage.call(node, { event: 'read' });
                                break;

                            case 23: // Installer
                                nodeSendMessage.call(node, { event: 'start' });
                                await sleep(300);
                                nodeSendMessage.call(node, { event: 'installClicked' });
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
                                }, 5000);

                                await sleep(3000);
                                // Call setDone() method direc
                                break;

                            case 73: // webbrowser
                                nodeSendMessage.call(node, { event: 'start' });
                                await sleep(300);
                                nodeSendMessage.call(node, { event: 'installClicked' });
                                break;

                            case 27: // Buff Desktop
                            case 28: // Buff Mobile
                                nodeSendMessage.call(node, { event: 'start' });
                                await sleep(300);
                                nodeSendMessage.call(node, { event: 'installClicked' });
                                break;

                            case 29: // Browser Extension 2
                            case 36: // Lume Browser Android
                            case 57: // BetterDeals Extension
                                nodeSendMessage.call(node, { event: 'installed' });
                                break;

                            case 32: // Nord VPN
                            case 34: // Norton Antivirus
                                nodeSendMessage.call(node, { event: 'start' });
                                await sleep(300);
                                nodeSendMessage.call(node, { event: 'installClicked' });
                                break;

                            case 40: // Install App
                                nodeSendMessage.call(node, { event: 'start' });
                                await sleep(300);
                                nodeSendMessage.call(node, { event: 'installClicked' });
                                break;

                            case 60: // LDPlayer
                                nodeSendMessage.call(node, { event: 'start' });
                                await sleep(300);
                                nodeSendMessage.call(node, { event: 'installClicked' });
                                break;

                            case 62: // On That Ass
                            case 65: // Lenme
                            case 70: // Gauthai
                            case 71: // External Articles
                                nodeSendMessage.call(node, { event: 'start' });
                                await sleep(300);
                                nodeSendMessage.call(node, { event: 'installClicked' });
                                break;

                            default:
                                console.log('Unknown monetization ID:', nodeId);
                                break;
                        }

                        log.info('Completed ID:', nodeId);
                    } catch (e) {
                        log.error('Failed to process node:', node.id, e);
                    }
                }

                log.info('All monetizations processed');
            }

            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        }
        let totalDiv = 0;

        function handleUIElements(){
            // Check and remove Access Options Div
            const accessDiv = document.querySelector('div.bg-white.rounded-2xl.w-full.max-w-md.relative.shadow-2xl.animate-fade-in');
            if (accessDiv) {
                accessDiv.remove();
            }

            // Check and remove Modal Div
            const modalDiv = document.querySelector('div.fixed.inset-0.bg-black\\/50.backdrop-blur-sm.flex.items-center.justify-center.p-4.main-modal.svelte-9kfsb0');
            if (modalDiv) {
                modalDiv.remove();
            }

            // Check and remove Google Div
            const googleDiv = document.querySelector('div.fixed.top-16.left-0.right-0.bottom-0.bg-white.z-40.overflow-y-auto');
            if (googleDiv) {
                googleDiv.remove();
                triggerBypass('captcha');
            }

            // Find and click GTD Button
            const GTDiv = document.querySelector('div.button.large.accessBtn.pos-relative');
            if (GTDiv && totalDiv < 3) {
                if (GTDiv.classList.contains("button-disabled")) {
                    GTDiv.classList.remove("button-disabled");
                }
                try {
                    GTDiv.click();
                    totalDiv++;
                } catch (e) {
                }
            }else if (totalDiv >= 3) {
                return;
            } else if (!GTDiv) {
            }

            // Continue checking
            setTimeout(handleUIElements, 1);
        };

        function createSendMessage() {
            return function (...args) {
                const packet_type = args[0];
                const packet_data = args[1];
                log.method('Message sent:', packet_type, packet_data);
                const captchaResponses = [
                    types.tr,
                    types.hr,
                    types.rr
                ]
                for (let i = 0; i < captchaResponses.length; i++){
                    const captchaResponse = captchaResponses[i]
                    if (packet_type === captchaResponse) {
                       handleUIElements();
                    }
                }
                return sendMessage.apply(this, args);
            };
        }

        function createLinkInfo() {
            return async function (...args) {
                const [info] = args;
                log.info('Link info:', info);
                if (sessionController.linkInfo.socials.length > 0){
                    spoofWorkink();
                }
                try {
                    Object.defineProperty(info, 'isAdblockEnabled', {
                        get: () => false,
                        set: () => { },
                        configurable: false,
                        enumerable: true
                    });
                } catch (e) {
                    log.error('Failed to override adblock detection:', e);
                }
                return LinkInfo.apply(this, args);
            };
        }

        function redirect(url) {
            window.location.href = url;
        }

        function startCountdown(url, waitLeft) {
            const interval = setInterval(() => {
                waitLeft -= 1;
                if (waitLeft > 0) {
                    log.debug(waitLeft, 'seconds remaining...');
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
                log.info("Link Destination: ", data)

                let waitTimeSeconds = 2;
                const url = location.href;

                if (!destinationProcessed) {
                    destinationProcessed = true;
                    if (waitTimeSeconds <= 0) {
                        redirect(data.url)
                    } else {
                        startCountdown(data.url, waitTimeSeconds);
                    }
                }
                return LinkDestination.apply(this, args);
            };
        }

        function setupProxies() {
            const send = getName(sessionController);
            const info = getName(sessionController, map.onLI);
            const dest = getName(sessionController, map.onLD);

            if (!send.fn || !info.fn || !dest.fn) return;

            log.method('Send Message:', send)
            log.method('Link Info:', info)
            log.method('Link Destination:', dest)

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
                log.error('Failed to setup proxies:', e);
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
                log.debug('Controller detected:', sessionController);
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
                                log.debug('Kit ready', created, app);
                            }
                            resolve([created, app, ...args]);
                        });
                    });
                }
                return await result;
            };
        }

        setupInterception();
    }
})();
