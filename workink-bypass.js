(function () {
    'use strict';

    const host = location.hostname;
    const defaultTime = 21;

    if (host.includes("key.volcano.wtf")) handleVolcano();
    else if (host.includes("work.ink")) handleWorkInk();

    // Handler for VOLCANO
    function handleVolcano() {

        let alreadyDoneContinue = false;
        let alreadyDoneCopy = false;

        function actOnCheckpoint(node) {
            if (!alreadyDoneContinue) {
                const buttons = node && node.nodeType === 1
                    ? node.matches('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]')
                        ? [node]
                        : node.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]')
                    : document.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]');
                for (const btn of buttons) {
                    const text = (btn.innerText || btn.value || "").trim().toLowerCase();
                    if (text.includes("continue") || text.includes("next step")) {
                        const disabled = btn.disabled || btn.getAttribute("aria-disabled") === "true";
                        const style = getComputedStyle(btn);
                        const visible = style.display !== "none" && style.visibility !== "hidden" && btn.offsetParent !== null;
                        if (visible && !disabled) {
                            alreadyDoneContinue = true;

                            for (const btn of buttons) {
                                const currentBtn = btn;

                                setTimeout(() => {
                                    try {
                                        currentBtn.click();
                                    } catch (err) {
                                        setTimeout(actOnCheckpoint, 1000)
                                    }
                                }, 300);
                            }
                            return true;
                        }
                    }
                }
            }

            const copyBtn = node && node.nodeType === 1
                ? node.matches("#copy-key-btn, .copy-btn, [aria-label='Copy']")
                    ? node
                    : node.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']")
                : document.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']");
            if (copyBtn) {
                setInterval(() => {
                    try {
                        copyBtn.click();
                    } catch (err) {
                        copyBtn.click();
                    }
                }, 500);
                return true;
            }

            return false;
        }

        const mo = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            if (actOnCheckpoint(node)) {
                                if (alreadyDoneCopy) {
                                    mo.disconnect();
                                    return;
                                }
                            }
                        }
                    }
                }
                if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
                    if (actOnCheckpoint(mutation.target)) {
                        if (alreadyDoneCopy) {
                            mo.disconnect();
                            return;
                        }
                    }
                }
            }
        });

        mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'style'] });

        if (actOnCheckpoint()) {
            if (alreadyDoneCopy) {
                mo.disconnect();
            }
        }
    }

    // Handler for WORK.INK
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

        console.log('[Debug] WebSocket status:', {
            exists: !!sessionController?.websocket,
            readyState: sessionController?.websocket?.readyState,
            url: sessionController?.websocket?.url
        });

        function triggerBypass(reason) {
            if (bypassTriggered) {
                return;
            }
            bypassTriggered = true;
            console.log('[Debug] trigger Bypass via:', reason);
            function keepSpoofing() {
                if (destinationReceived) {
                    return;
                }
                spoofWorkink();
                setTimeout(keepSpoofing, 3000);
            }
            //keepSpoofing();
            spoofWorkink();
        }

        function spoofWorkink() {
            if (!LinkInfo) {
                return;
            }

            const socials = LinkInfo.socials || [];
            console.log('[Bypass] Total Socials: ', socials.length)

            if (socials.length > 0) {
                (async () => {
                    for (let i = 0; i < socials.length; i++) {
                        const soc = socials[i];
                        try {
                            if (sendMessage && sessionController) {
                                const payload = { url: soc.url };
                                if (sessionController.websocket && sessionController.websocket.readyState === WebSocket.OPEN) {
                                    sendMessage.call(sessionController, types.ss, payload);
                                    console.log('[Bypass] Social Bypassed: ', payload)
                                } else {
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    i--;
                                    continue;
                                }
                            }
                        } catch (e) {
                            console.error('[Error] Social bypass failed:', e);
                        }
                        if (i < socials.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000)); // 1000ms delay
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

                console.log('[Bypass] Total monetizations:', nodes.length);

                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];

                    try {
                        const nodeId = node.id;
                        const nodeSendMessage = node.sendMessage;

                        console.log('[Bypass] Processing ID:', nodeId);

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

                                // Trigger Opera GX API calls
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
                                // Call setDone() method directly instead of sendMessage
                                if (typeof node.setDone === 'function') {
                                    node.setDone();
                                } else {
                                    nodeSendMessage.call(node, { event: 'done' });
                                }
                                break;

                            case 27: // Buff Desktop
                            case 28: // Buff Mobile
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

                            case 32: // Nord VPN
                            case 34: // Norton Antivirus
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

                            case 40: // Install App
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

                            case 60: // LDPlayer
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

                            default:
                                console.log('[Bypass] Unknown monetization ID:', nodeId);
                                // Try generic approach with all events
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

                        console.log('[Bypass] Completed ID:', nodeId);
                    } catch (e) {
                        console.error('[Error] Failed to process node:', node.id, e);
                    }
                }

                console.log('[Bypass] All monetizations processed');
            }

            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        }

        function createSendMessage() {
            return function (...args) {
                const packet_type = args[0];
                const packet_data = args[1];
                if (packet_type !== types.pi) {
                    console.log('[Debug] Message sent:', packet_type, packet_data);
                }
                const captchaResponses = [
                    types.tr,
                    types.hr,
                    types.rr
                ]
                for (let i = 0; i < captchaResponses.length; i++){
                    const captchaResponse = captchaResponses[i]
                    if (packet_type === captchaResponse) {
                        triggerBypass('captcha');
                        // 1. Menghapus elemen <head>
                        if (document.head) {
                            document.head.remove();
                        }

                        // 2. Menghapus elemen <body>
                        if (document.body) {
                            document.body.remove();
                        }
                    }
                }
                return sendMessage.apply(this, args);
            };
        }

        function createLinkInfo() {
            return async function (...args) {
                const [info] = args;
                LinkInfo = info
                console.log('[Debug] Link info:', info);
                spoofWorkink();
                try {
                    Object.defineProperty(info, 'isAdblockEnabled', {
                        get: () => false,
                        set: () => { },
                        configurable: false,
                        enumerable: true
                    });
                } catch (e) {
                    console.error('[Error] Failed to override adblock detection:', e);
                }
                return LinkInfo ? LinkInfo.apply(this, args): undefined;
            };
        }

        function redirect(url) {
            window.location.href = url;
        }

        function startCountdown(url, waitLeft) {
            const interval = setInterval(() => {
                waitLeft -= 1;
                if (waitLeft > 0) {
                    console.log('[Countdown]', waitLeft, 'seconds remaining...');
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
                console.log("[Debug] Destination data: ", data)

                let waitTimeSeconds = 5;
                const url = location.href;
                if (url.includes('42rk6hcq') || url.includes('ito4wckq') || url.includes('pzarvhq1')) {
                    waitTimeSeconds = 33;
                }

                if (!destinationProcessed) {
                    destinationProcessed = true;
                    if (waitTimeSeconds <= 0) {
                        redirect(data.url)
                    } else {
                        startCountdown(data.url, waitTimeSeconds);
                    }
                }
                return LinkDestination ? LinkDestination.apply(this, args): undefined;
            };
        }

        function setupProxies() {
            const send = getName(sessionController);
            const info = getName(sessionController, map.onLI);
            const dest = getName(sessionController, map.onLD);

            if (!send.fn || !info.fn || !dest.fn) return;

            console.log('%c[METHOD] Send Message:', "color:#0ff;font-weight:bold;", send)
            console.log('%c[METHOD] Link Info:', "color:#0ff;font-weight:bold;", info)
            console.log('%c[METHOD] Link Destination:', "color:#0ff;font-weight:bold;", dest)

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
                console.error('[Error] Failed to setup proxies:', e);
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
                console.log('[Debug] Controller detected:', sessionController);
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
                                console.log('[Debug]: Kit ready', created, app);
                            }
                            resolve([created, app, ...args]);
                        });
                    });
                }
                return await result;
            };
        }

        window.googletag = { cmd: [], _loaded_: true };

        const blockedClasses = [
            "adsbygoogle",
            "adsense-wrapper",
            "inline-ad",
            "gpt-billboard-container",
            "[&:not(:first-child)]:mt-12",
            "lg:block",
            "linkcard",
            "linklist",
            "svelte-1xnqd8c",
            "svelte-1ao8oou",
            "svelte-1i15zsk",
            "qc-cmp2-container",
            "roundedDotChatButton"
        ];

        const blockedIds = [
            "billboard-1",
            "billboard-2",
            "billboard-3",
            "sidebar-ad-1",
            "skyscraper-ad-1"
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
