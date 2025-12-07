// ==UserScript==
// @name         Valex Key System Auto Complete
// @namespace    http://tampermonkey.net/
// @version      1.0.0.0
// @description  Automatically complete Valex key system checkpoints
// @author       Difz25x
// @match        *://*.valex.io
// @match        *://work.ink/3t0/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const COLORS = {
        info: 'color: #00ff00; font-weight: bold; font-size: 13px',
        error: 'color: #ff0000; font-weight: bold; font-size: 13px',
        warning: 'color: #ffa500; font-weight: bold; font-size: 13px',
        success: 'color: #00ffff; font-weight: bold; font-size: 13px',
        header: 'color: #ff6b6b; font-weight: bold; font-size: 16px; text-shadow: 0 0 5px rgba(255,107,107,0.5)'
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
            font-family: 'Segoe UI', 'Arial', sans-serif;
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
    };

    const isCheckpointPage = () => {
        return window.location.href.includes('workink.net') ||
               window.location.href.includes('work.ink');
    };

    const isKeySystemPage = () => {
        return window.location.href.includes('valex.io');
    };

    const handleCheckpointPage = async () => {

        // Mark referrer
        const mainPageUrl = location.pathname.includes('c8byc7q8') ? 'https://extkey.valex.io' : 'https://key.valex.io';
        try {
            localStorage.setItem('lastLinkVisited', window.location.href);
            localStorage.setItem('lastLinkVisitTime', Date.now().toString());
            localStorage.setItem('lastReferrer', window.location.href);
        } catch(e) {}

        let countdown = 20;

        const updateCountdown = () => {
            updateStatusBox(`
                <div style="text-align: center;">
                    <div style="font-size: 14px; margin-bottom: 10px; opacity: 0.9;">
                        🔓 Valex Auto
                    </div>
                    <div style="font-size: 13px; margin-bottom: 8px; color: #ffd700;">
                        ⏱️ Checkpoint Page
                    </div>
                    <div style="font-size: 36px; margin: 12px 0; font-weight: bold; color: #fff;">
                        ${countdown}s
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">
                        Returning to key system...
                    </div>
                </div>
            `);
        };

        updateCountdown();

        const interval = setInterval(() => {
            countdown--;
            updateCountdown();

            if (countdown <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        await sleep(16000);


        updateStatusBox(`
            <div style="text-align: center;">
                <div style="font-size: 14px; margin-bottom: 10px;">
                    🔓 Valex Auto
                </div>
                <div style="font-size: 13px; color: #00ff00;">
                    ✅ Redirecting back...
                </div>
            </div>
        `);

        await sleep(1000);

        if (mainPageUrl && mainPageUrl !== window.location.href) {
            window.location.href = mainPageUrl;
        } else {
            window.history.back();
        }
    };

    const findCheckpointButton = () => {
        const buttons = document.querySelectorAll('button');

        for (let btn of buttons) {
            const text = btn.textContent.trim();
            if (text.includes('Complete Checkpoint') ||
                text.includes('Complete checkpoint')) {
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
                <div style="font-size: 14px; margin-bottom: 12px; opacity: 0.9;">
                    🔓 Valex Auto
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
        const linkOpened = sessionStorage.getItem('keySystemLinkOpened');
        const openTimestamp = parseInt(sessionStorage.getItem('keySystemLinkOpenTimestamp') || '0');
        const timeSpent = Date.now() - openTimestamp;

        const lastVisited = localStorage.getItem('lastLinkVisited') || '';
        const isReturningFromCheckpoint = lastVisited.includes('workink.net') ||
                                          lastVisited.includes('work.ink');

        if (linkOpened === 'true' && isReturningFromCheckpoint && timeSpent >= 15000) {

            const currentStep = parseInt(sessionStorage.getItem('keySystemStep') || '0');

            updateValexStatus('processing', currentStep, 'Completing checkpoint...');

            try {
                const stepToken = sessionStorage.getItem(`keySystemStepToken_${currentStep}`);
                const navToken = sessionStorage.getItem(`keySystemNavToken_${currentStep}`);
                const challenge = sessionStorage.getItem(`keySystemChallenge_${currentStep}`);

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
                        token: stepToken,
                        navigationToken: navToken,
                        clientReferrer: 'https://work.ink/',
                        challenge: challenge
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
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

                    updateValexStatus('complete', newStep, 'Reloading page...');

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

        button.click();

        updateValexStatus('processing', currentStep, 'Redirecting to checkpoint...');
    };

    const handleMainPage = async () => {

        try {
        } catch(e) {}


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
        await sleep(1000);

        setupAntiDetection();

        if (isCheckpointPage()) {
            await handleCheckpointPage();
        } else if (isKeySystemPage()) {
            await handleMainPage();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
