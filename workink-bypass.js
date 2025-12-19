(function () {
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

    if (host.includes("work.ink")) {
        handleWorkInk();
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
                        log.info(`Processing monetization [${i+1}/${nodes.length}]:`, node);

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
                        triggerBypass('captcha');
                    }
                }
                return sendMessage.apply(this, args);
            };
        }

        function createLinkInfo() {
            return async function (...args) {
                const [info] = args;
                log.info('Link info:', info);
                spoofWorkink();
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

                let waitTimeSeconds = 12;
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

        const hide = 'W2lkXj0iYnNhLXpvbmVfIl0sCmRpdi5maXhlZC5pbnNldC0wLmJnLWJsYWNrXC81MC5iYWNrZHJvcC1ibHVyLXNtLApkaXYuZG9uZS1iYW5uZXItY29udGFpbmVyLnN2ZWx0ZS0xeWptazFnLAppbnM6bnRoLW9mLXR5cGUoMSksCmRpdjpudGgtb2YtdHlwZSg5KSwKZGl2LmZpeGVkLnRvcC0xNi5sZWZ0LTAucmlnaHQtMC5ib3R0b20tMC5iZy13aGl0ZS56LTQwLm92ZXJmbG93LXktYXV0bywKcFtzdHlsZV0sCi5hZHNieWdvb2dsZSwKLmFkc2Vuc2Utd3JhcHBlciwKLmlubGluZS1hZCwKLmdwdC1iaWxsYm9hcmQtY29udGFpbmVyLAojYmlsbGJvYXJkLTEsCiNiaWxsYm9hcmQtMiwKI2JpbGxib2FyZC0zLAojc2lkZWJhci1hZC0xLAojc2t5c2NyYXBlci1hZC0xLApkaXYubGdcOmJsb2NrIHsKICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsKfQ==';

        const style = document.createElement('style');
        style.textContent = (typeof atob === 'function') ? atob(hide) : (Buffer ? Buffer.from(hide, 'base64').toString() : '');
        (document.head || document.documentElement).appendChild(style);

        const ob = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    if (node.classList?.contains('adsbygoogle')) node.remove();
                    node.querySelectorAll?.('.adsbygoogle').forEach(el => el.remove());
                }
            }
        });
        ob.observe(document.documentElement, { childList: true, subtree: true });
    }
})();
