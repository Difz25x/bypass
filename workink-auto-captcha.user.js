// ==UserScript==
// @name         Auto work-ink captcha solver
// @namespace    http://tampermonkey.net/
// @version      1.0.0.0
// @description  This will overdrive work.ink captcha from Turnstile to Recaptcha
// @author       Difz25x
// @match        https://work.ink/*
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
        configurable: true
    });

    if (navigator.userAgent.includes('HeadlessChrome')) {
        Object.defineProperty(navigator, 'userAgent', {
            get: () => navigator.userAgent.replace('HeadlessChrome', 'Chrome'),
            configurable: true
        });
    }

    Object.defineProperty(navigator, 'plugins', {
        get: () => [
            {
                0: { type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format" },
                description: "Portable Document Format",
                filename: "internal-pdf-viewer",
                length: 1,
                name: "Chrome PDF Plugin"
            },
            {
                0: { type: "application/pdf", suffixes: "pdf", description: "" },
                description: "",
                filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                length: 1,
                name: "Chrome PDF Viewer"
            },
            {
                0: { type: "application/x-nacl", suffixes: "", description: "Native Client Executable" },
                1: { type: "application/x-pnacl", suffixes: "", description: "Portable Native Client Executable" },
                description: "",
                filename: "internal-nacl-plugin",
                length: 2,
                name: "Native Client"
            }
        ],
        configurable: true
    });

    Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true
    });

    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );

    if (!window.chrome) {
        window.chrome = {};
    }

    if (!window.chrome.runtime) {
        window.chrome.runtime = {
            connect: function() {},
            sendMessage: function() {}
        };
    }

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    let mouseMovements = 0;
    let touchEvents = 0;

    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'mousemove') mouseMovements++;
        if (type === 'touchstart' || type === 'touchend') touchEvents++;
        return originalAddEventListener.call(this, type, listener, options);
    };

    Object.defineProperties(window.screen, {
        availWidth: { get: () => window.screen.width },
        availHeight: { get: () => window.screen.height - 40 },
        colorDepth: { get: () => 24 },
        pixelDepth: { get: () => 24 }
    });

    const originalDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(...args) {
        if (args.length === 0 || !args[0]) {
            args[0] = 'en-US';
        }
        return new originalDateTimeFormat(...args);
    };
    Intl.DateTimeFormat.prototype = originalDateTimeFormat.prototype;

    if (!navigator.getBattery) {
        navigator.getBattery = () => Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true
        });
    }

    if (!navigator.connection) {
        Object.defineProperty(navigator, 'connection', {
            get: () => ({
                effectiveType: '4g',
                rtt: 50,
                downlink: 10,
                saveData: false,
                addEventListener: () => {},
                removeEventListener: () => {}
            }),
            configurable: true
        });
    }

    Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
        configurable: true
    });

    Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
        configurable: true
    });

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const originalEnumerateDevices = navigator.mediaDevices.enumerateDevices;
        navigator.mediaDevices.enumerateDevices = () => {
            return originalEnumerateDevices.call(navigator.mediaDevices).then(devices => {
                if (devices.length === 0) {
                    return [
                        { deviceId: "default", kind: "audioinput", label: "", groupId: "default" },
                        { deviceId: "default", kind: "audiooutput", label: "", groupId: "default" },
                        { deviceId: "default", kind: "videoinput", label: "", groupId: "default" }
                    ];
                }
                return devices;
            });
        };
    }

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
            return 'Intel Inc.';
        }
        if (parameter === 37446) {
            return 'Intel Iris OpenGL Engine';
        }
        return getParameter.call(this, parameter);
    };

    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
        const context = this.getContext('2d');
        if (context) {
            const imageData = context.getImageData(0, 0, this.width, this.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
                if (Math.random() < 0.001) {
                    imageData.data[i] = imageData.data[i] ^ 1;
                }
            }
            context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, args);
    };

    Object.defineProperty(Notification, 'permission', {
        get: () => 'default',
        configurable: true
    });

    const originalLog = console.log;
    console.log = function(...args) {
        const stack = new Error().stack;
        if (stack && !stack.includes('tampermonkey')) {
            return originalLog.apply(console, args);
        }
    };

    const originalToString = Function.prototype.toString;
    Function.prototype.toString = function() {
        if (this === navigator.webdriver ||
            this === navigator.plugins ||
            this === navigator.languages) {
            return 'function () { [native code] }';
        }
        return originalToString.call(this);
    };

    Object.defineProperty(window, 'length', {
        get: () => 0,
        configurable: true
    });

    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

    if (window.performance && window.performance.timing) {
        const originalTiming = window.performance.timing;
        Object.defineProperty(window.performance, 'timing', {
            get: () => {
                const timing = { ...originalTiming };
                const now = Date.now();
                timing.fetchStart = now - Math.random() * 1000;
                timing.domainLookupStart = timing.fetchStart + Math.random() * 50;
                timing.domainLookupEnd = timing.domainLookupStart + Math.random() * 30;
                timing.connectStart = timing.domainLookupEnd + Math.random() * 20;
                timing.connectEnd = timing.connectStart + Math.random() * 100;
                return timing;
            },
            configurable: true
        });
    }

    let lastMouseMove = Date.now();
    const simulateNaturalMouseMovement = () => {
        if (Date.now() - lastMouseMove > 5000) {
            const event = new MouseEvent('mousemove', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: Math.random() * window.innerWidth,
                clientY: Math.random() * window.innerHeight
            });
            document.dispatchEvent(event);
            lastMouseMove = Date.now();
        }
    };

    setInterval(simulateNaturalMouseMovement, 5000);

    const simulateKeyboardActivity = () => {
        if (Math.random() < 0.1) {
            const event = new KeyboardEvent('keydown', {
                key: 'Tab',
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        }
    };

    setInterval(simulateKeyboardActivity, 10000);

    const originalAttachShadow = Element.prototype.attachShadow;
    const shadowRoots = new WeakMap();

    Object.defineProperty(Element.prototype, 'attachShadow', {
        value: function(options) {
            return originalAttachShadow.call(this, { ...options, mode: 'open' });
        },
        configurable: false,
        writable: false
    });

    console.log("Sistem Aktif: Semua Shadow Root baru akan otomatis menjadi 'OPEN'.");

    function getAllShadowRoots(element = document.body) {
        const shadows = [];

        function traverse(el) {
            if (el.shadowRoot) {
                shadows.push(el.shadowRoot);
                traverse(el.shadowRoot);
            }

            if (shadowRoots.has(el)) {
                const shadow = shadowRoots.get(el);
                if (!shadows.includes(shadow)) {
                    shadows.push(shadow);
                    traverse(shadow);
                }
            }

            if (el.children) {
                for (let child of el.children) {
                    traverse(child);
                }
            }
        }

        traverse(element);
        return shadows;
    }

    function querySelectorDeep(selector, root = document) {
        let element = root.querySelector(selector);
        if (element) return element;

        const shadows = getAllShadowRoots(root);
        for (let shadow of shadows) {
            element = shadow.querySelector(selector);
            if (element) return element;

            element = querySelectorDeep(selector, shadow);
            if (element) return element;
        }

        return null;
    }

    function querySelectorAllDeep(selector, root = document) {
        const elements = [];

        elements.push(...root.querySelectorAll(selector));

        const shadows = getAllShadowRoots(root);
        for (let shadow of shadows) {
            elements.push(...shadow.querySelectorAll(selector));
            elements.push(...querySelectorAllDeep(selector, shadow));
        }

        return elements;
    }

    const CLOUDFLARE_CHALLENGE_URL = 'challenges.cloudflare.com/cdn-cgi/challenge-platform';
    const MONITORING_INTERVAL = 2000;
    const CLICK_X = 30;
    const CLICK_Y = 30;
    const DEFAULT_TIMEOUT = 30000;

    const checkTurnstile = ({ timeout = DEFAULT_TIMEOUT } = {}) => {
        return new Promise(async (resolve, reject) => {
            let monitoringActive = true;
            const startTime = Date.now();

            const sleep = (ms) => new Promise(r => setTimeout(r, ms));

            const findTurnstileContainer = () => {
                let element = querySelectorDeep('[name="cf-turnstile-response"]');
                if (element) {
                    return element.parentElement;
                }

                let coordinates = [];

                const allDivs = querySelectorAllDeep('div');

                allDivs.forEach(item => {
                    try {
                        const rect = item.getBoundingClientRect();
                        const style = window.getComputedStyle(item);

                        if (rect.width >= 290 && rect.width <= 310) {
                            if (style.margin === "0px" && style.padding === "0px" && !item.querySelector('*')) {
                                coordinates.push({
                                    element: item,
                                    rect: rect,
                                    priority: 1
                                });
                            }
                            else if (!item.querySelector('*')) {
                                coordinates.push({
                                    element: item,
                                    rect: rect,
                                    priority: 2
                                });
                            }
                            else {
                                coordinates.push({
                                    element: item,
                                    rect: rect,
                                    priority: 3
                                });
                            }
                        }
                    } catch (err) {}
                });

                if (coordinates.length > 0) {
                    coordinates.sort((a, b) => a.priority - b.priority);
                    return coordinates[0];
                }

                const iframes = querySelectorAllDeep('iframe');
                for (const iframe of iframes) {
                    const src = iframe.src || '';
                    if (src.includes(CLOUDFLARE_CHALLENGE_URL)) {
                        return { element: iframe, rect: iframe.getBoundingClientRect(), priority: 0 };
                    }
                }

                return null;
            };

            const performClick = (container, x, y) => {
                try {
                    let targetElement = container.element;
                    const rect = container.rect;
                    const absoluteX = rect.x + x;
                    const absoluteY = rect.y + (rect.height / 2);

                    let checkboxInput = null;

                    try {
                        checkboxInput = targetElement.querySelector('input[type="checkbox"]');
                    } catch (e) {}

                    if (!checkboxInput && targetElement.tagName === 'IFRAME') {
                        try {
                            if (targetElement.contentDocument) {
                                checkboxInput = targetElement.contentDocument.querySelector('input[type="checkbox"]');
                            }
                        } catch (e) {}
                    }

                    if (!checkboxInput && targetElement.shadowRoot) {
                        checkboxInput = targetElement.shadowRoot.querySelector('input[type="checkbox"]');
                    }

                    if (!checkboxInput) {
                        checkboxInput = querySelectorDeep('input[type="checkbox"]', targetElement);
                    }

                    if (!checkboxInput) {
                        const elementAtPoint = document.elementFromPoint(absoluteX, absoluteY);
                        if (elementAtPoint && elementAtPoint !== document.documentElement && elementAtPoint !== document.body) {
                            if (elementAtPoint.tagName === 'INPUT' && elementAtPoint.type === 'checkbox') {
                                checkboxInput = elementAtPoint;
                            } else {
                                targetElement = elementAtPoint;
                            }
                        }
                    }

                    if (checkboxInput && checkboxInput.tagName === 'INPUT' && checkboxInput.type === 'checkbox') {
                        checkboxInput.checked = true;

                        const events = ['change', 'input', 'click'];
                        events.forEach(eventType => {
                            const event = new Event(eventType, { bubbles: true, cancelable: true });
                            checkboxInput.dispatchEvent(event);
                        });

                        targetElement = checkboxInput;
                    }

                    const mouseEvents = [
                        new MouseEvent('mousedown', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: absoluteX,
                            clientY: absoluteY,
                            button: 0
                        }),
                        new MouseEvent('mouseup', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: absoluteX,
                            clientY: absoluteY,
                            button: 0
                        }),
                        new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: absoluteX,
                            clientY: absoluteY,
                            button: 0
                        })
                    ];

                    mouseEvents.forEach(event => {
                        targetElement.dispatchEvent(event);
                        if (targetElement !== container.element) {
                            container.element.dispatchEvent(event);
                        }
                    });

                    try {
                        const pointerEvents = [
                            new PointerEvent('pointerdown', {
                                view: window,
                                bubbles: true,
                                cancelable: true,
                                clientX: absoluteX,
                                clientY: absoluteY,
                                button: 0,
                                pointerType: 'mouse'
                            }),
                            new PointerEvent('pointerup', {
                                view: window,
                                bubbles: true,
                                cancelable: true,
                                clientX: absoluteX,
                                clientY: absoluteY,
                                button: 0,
                                pointerType: 'mouse'
                            })
                        ];

                        pointerEvents.forEach(event => targetElement.dispatchEvent(event));
                    } catch (e) {}

                    try {
                        if (typeof Touch !== 'undefined') {
                            const touch = new Touch({
                                identifier: Date.now(),
                                target: targetElement,
                                clientX: absoluteX,
                                clientY: absoluteY,
                                radiusX: 2.5,
                                radiusY: 2.5,
                                rotationAngle: 0,
                                force: 0.5
                            });

                            const touchEvents = [
                                new TouchEvent('touchstart', {
                                    view: window,
                                    bubbles: true,
                                    cancelable: true,
                                    touches: [touch],
                                    targetTouches: [touch],
                                    changedTouches: [touch]
                                }),
                                new TouchEvent('touchend', {
                                    view: window,
                                    bubbles: true,
                                    cancelable: true,
                                    touches: [],
                                    targetTouches: [],
                                    changedTouches: [touch]
                                })
                            ];

                            touchEvents.forEach(event => targetElement.dispatchEvent(event));
                        }
                    } catch (e) {}
                } catch (error) {}
            };

            const checkForToken = () => {
                try {
                    let element = document.querySelector('[name="cf-turnstile-response"]');
                    if (element && element.value && element.value.length > 20) {
                        return { token: element.value, element: element };
                    }

                    element = querySelectorDeep('[name="cf-turnstile-response"]');
                    if (element && element.value && element.value.length > 20) {
                        return { token: element.value, element: element };
                    }

                    return null;
                } catch (e) {
                    return null;
                }
            };

            const submitForm = (tokenElement) => {
                try {
                    let form = tokenElement.closest('form');
                    if (form) {
                        const events = ['input', 'change', 'blur'];
                        events.forEach(eventType => {
                            const event = new Event(eventType, { bubbles: true, cancelable: true });
                            tokenElement.dispatchEvent(event);
                        });

                        setTimeout(() => {
                            if (form.submit && typeof form.submit === 'function') {
                                form.submit();
                            } else {
                                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                                if (submitBtn) {
                                    submitBtn.click();
                                } else {
                                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                                    form.dispatchEvent(submitEvent);
                                }
                            }
                        }, 10);

                        return true;
                    }

                    const submitButtons = querySelectorAllDeep('button[type="submit"], input[type="submit"], button:not([type])');
                    for (const btn of submitButtons) {
                        const btnText = (btn.textContent || btn.value || '').toLowerCase();
                        if (btnText.includes('submit') ||
                            btnText.includes('continue') ||
                            btnText.includes('verify') ||
                            btnText.includes('next') ||
                            btnText.includes('proceed')) {
                            setTimeout(() => {
                                btn.click();
                            }, 100);
                            return true;
                        }
                    }

                    let redirected = false;
                    const checkRedirect = setInterval(() => {
                        if (document.readyState === 'loading' || redirected) {
                            clearInterval(checkRedirect);
                            redirected = true;
                        }
                    }, 100);

                    setTimeout(() => {
                        clearInterval(checkRedirect);
                    }, 10);

                    return false;
                } catch (error) {
                    return false;
                }
            };

            const monitor = async () => {
                while (monitoringActive) {
                    if (Date.now() - startTime > timeout) {
                        monitoringActive = false;
                        return reject(new Error('Timeout'));
                    }

                    try {
                        const container = findTurnstileContainer();

                        if (container) {
                            performClick(container, CLICK_X, CLICK_Y);
                        }

                        const result = checkForToken();
                        if (result) {
                            monitoringActive = false;
                            submitForm(result.element);
                            return resolve(result.token);
                        }
                    } catch (error) {}

                    await sleep(MONITORING_INTERVAL);
                }
            };

            try {
                await monitor();
            } catch (error) {
                reject(error);
            }
        });
    };

    const initTurnstileSolver = () => {
        checkTurnstile()
            .then(token => {})
            .catch(error => {});
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTurnstileSolver);
    } else {
        initTurnstileSolver();
    }
})();
