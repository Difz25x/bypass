// ===================== TRANSLATIONS =====================
const translations = {
  vi: {
    title: 'Workink Bypasser',
    pleaseSolveCaptcha: 'Vui lòng giải CAPTCHA để tiếp tục',
    captchaSuccess: 'CAPTCHA đã thành công',
    redirectingToWork: 'Đang qua Work.ink...',
    redirectingToWorkCountdown: 'Đang chuyển hướng tới Work.ink trong {seconds} giây...',
    bypassSuccessCopy: "Bypass thành công, đã Copy Key (bấm 'Cho Phép' nếu có)",
    waitingCaptcha: 'Đang chờ CAPTCHA...',
    pleaseReload: 'Vui lòng tải lại trang...(workink lỗi)',
    reloading: 'đã giả mạo tải lại...',
    socialsdetected: 'các mạng xã hội được phát hiện bắt đầu giả mạo...',
    bypassSuccess: 'Bypass thành công',
    backToCheckpoint: 'Đang về lại Checkpoint...',
    captchaSuccessBypassing: 'CAPTCHA đã thành công, đang bypass...',
    version: 'v6.9.0.0',
    madeBy: 'Tạo bởi Difz & elfuhh',
    startRedirect: 'Bắt đầu chuyển hướng',
    redirectDelay: 'Độ trễ chuyển hướng',
    processingMonetizations: 'Đang xử lý monetizations...',
    processingSocials: 'Đang xử lý socials',
    bypassComplete: 'Bypass hoàn tất! Sẵn sàng chuyển hướng.',
    redirectingIn: 'Đang chuyển hướng trong',
    redirectingNow: 'Đang chuyển hướng...',
    language: 'Ngôn ngữ',
    minimize: 'Thu nhỏ',
    maximize: 'Mở rộng',
  },
  en: {
    title: 'Workink Bypasser',
    pleaseSolveCaptcha: 'Please solve the CAPTCHA to continue',
    captchaSuccess: 'CAPTCHA solved successfully',
    redirectingToWork: 'Redirecting to Work.ink...',
    redirectingToWorkCountdown: 'Redirecting to Work.ink in {seconds} seconds...',
    bypassSuccessCopy: "Bypass successful! Key copied (click 'Allow' if prompted)",
    waitingCaptcha: 'Waiting for CAPTCHA...',
    pleaseReload: 'Please reload the page...(workink bugs)',
    reloading: 'done spoofing, reloading...',
    socialsdetected: 'socials detected, beginning spoof...',
    bypassSuccess: 'Bypass successful!',
    backToCheckpoint: 'Returning to checkpoint...',
    captchaSuccessBypassing: 'CAPTCHA solved successfully, bypassing...',
    version: 'v6.9.0.0',
    madeBy: 'Made by Difz & elfuhh',
    startRedirect: 'Start Redirect',
    redirectDelay: 'Redirect delay',
    processingMonetizations: 'Processing monetizations...',
    processingSocials: 'Processing socials',
    bypassComplete: 'Bypass complete! Ready to redirect.',
    redirectingIn: 'Redirecting in',
    redirectingNow: 'Redirecting now...',
    language: 'Language',
    minimize: 'Minimize',
    maximize: 'Maximize',
  },
};

// ==================== MODERN UI PANEL ====================
class BypassPanel {
  constructor() {
    this.container = null;
    this.shadow = null;
    this.statusText = null;
    this.currentStatusKey = 'waitingCaptcha';
    this.statusColors = {
      info: '#3b82f6',
      social: '#06b6d4',
      bypassing: '#eab308',
      success: '#10b981',
      error: '#ef4444',
    };
    this.statusDot = null;
    this.statusRing = null;
    this.sliderContainer = null;
    this.sliderValue = null;
    this.slider = null;
    this.startBtn = null;
    this.langBtn = null;
    this.minMaxBtn = null;
    this.onStartCallback = null;
    this.redirectInProgress = false;
    this.selectedDelay = parseInt(localStorage.getItem('workink_delay') || '0', 10);
    this.currentLanguage = localStorage.getItem('lang') || 'en';
    this.isMinimized = localStorage.getItem('workink_minimized') === 'true';
    this.t = translations[this.currentLanguage] || translations.en;
    this.init();
  }

  init() {
    this.createPanel();
    this.setupEventListeners();
    if (this.isMinimized) {
      this.applyMinimizedState();
    }
  }

  createPanel() {
    this.container = document.createElement('div');
    this.shadow = this.container.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes fadeInSlideUp {
  0% { opacity: 0; transform: translateY(30px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(99, 102, 241, 0.1); }
  50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.5), 0 0 60px rgba(99, 102, 241, 0.2); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ringPulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 0.3;
  }
  50% { 
    transform: scale(1.1);
    opacity: 0.6;
  }
}

@keyframes ringSpin {
  0% { 
    transform: rotate(0deg);
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
  100% { 
    transform: rotate(360deg);
    opacity: 0.3;
  }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes progressPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.panel-wrapper {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 480px;
  z-index: 2147483647;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  animation: fadeInSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-wrapper.minimized {
  width: 360px;
}

.panel {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(59, 130, 246, 0.2),
    inset 0 1px 0 rgba(59, 130, 246, 0.1);
  position: relative;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(14, 165, 233, 0.15));
  filter: blur(40px);
  opacity: 0.6;
  animation: gradientShift 8s ease infinite;
  background-size: 200% 200%;
  pointer-events: none;
}

.header {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(14, 165, 233, 0.1));
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 3s infinite;
}

.title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.header-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.lang-btn, .minmax-btn {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.minmax-btn {
  padding: 8px 12px;
}

.lang-btn:hover, .minmax-btn:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.3));
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.lang-btn:active, .minmax-btn:active {
  transform: translateY(0);
}

.content {
  padding: 28px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 1000px;
  opacity: 1;
}

.content.minimized-hidden {
  max-height: 0;
  opacity: 0;
  padding: 0 28px;
  overflow: hidden;
}

.status-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-wrapper.minimized .status-card {
  margin-bottom: 0;
  position: relative;
  overflow: hidden;
}

.status-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
  pointer-events: none;
}

.status-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 15px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.panel-wrapper.minimized .status-card:hover {
  transform: none;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.status-dot-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-dot-ring {
  position: absolute;
  width: 48px;
  height: 48px;
  border: 2px solid;
  border-radius: 50%;
  opacity: 0.3;
  border-style: dashed;
  animation: ringSpin 3s linear infinite;
}

.status-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.status-dot::after {
  content: '';
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border-radius: 50%;
  background: inherit;
  opacity: 0.3;
  filter: blur(8px);
}

.status-dot.info {
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  animation: pulse 2s ease-in-out infinite;
}

.status-dot.social {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  animation: pulse 1.5s ease-in-out infinite;
}

.status-dot.bypassing {
  background: linear-gradient(135deg, #eab308, #f59e0b);
  animation: pulse 1s ease-in-out infinite;
}

.status-dot.success {
  background: linear-gradient(135deg, #10b981, #059669);
  animation: glow 2s ease-in-out infinite;
}

.status-dot.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.status-text {
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  flex: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-section {
  display: none;
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slider-section.active {
  display: block;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.slider-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.slider-value {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.2));
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  min-width: 60px;
  text-align: center;
}

.slider-track {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: visible;
}

.slider-track::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #0ea5e9);
  border-radius: 12px;
  transition: width 0.05s linear;
  width: var(--slider-progress, 0%);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.slider {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 24px;
  transform: translateY(-50%);
  cursor: pointer;
  -webkit-appearance: none;
  z-index: 10;
  background: transparent;
  margin: 0;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  box-shadow: 
    0 4px 12px rgba(59, 130, 246, 0.4),
    0 0 0 4px rgba(59, 130, 246, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  cursor: grab;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 
    0 6px 16px rgba(59, 130, 246, 0.5),
    0 0 0 6px rgba(59, 130, 246, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.slider::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.15);
}

.slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  box-shadow: 
    0 4px 12px rgba(59, 130, 246, 0.4),
    0 0 0 4px rgba(59, 130, 246, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  cursor: grab;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 
    0 6px 16px rgba(59, 130, 246, 0.5),
    0 0 0 6px rgba(59, 130, 246, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.slider::-moz-range-thumb:active {
  cursor: grabbing;
  transform: scale(1.15);
}

.slider::-moz-range-track {
  background: transparent;
  border: none;
}

.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
  color: #ffffff;
  border: none;
  padding: 18px;
  border-radius: 16px;
  font-weight: 900;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 
    0 10px 30px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.start-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 15px 40px rgba(59, 130, 246, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.start-btn:hover::before {
  width: 300px;
  height: 300px;
}

.start-btn:active {
  transform: translateY(-1px);
}

.footer {
  padding: 20px 28px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.2));
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 1000px;
  opacity: 1;
}

.footer.minimized-hidden {
  max-height: 0;
  opacity: 0;
  padding: 0 28px;
  overflow: hidden;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.version, .credit {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.5px;
}

.links {
  display: flex;
  gap: 12px;
}

.link-btn {
  color: #ffffff;
  text-decoration: none;
  font-weight: 700;
  font-size: 12px;
  padding: 10px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.link-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.3));
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.link-btn:active {
  transform: translateY(0);
}

.min-btn {
  color: #ffffff;
  text-decoration: none;
  font-weight: 700;
  font-size: 12px;
  padding: 10px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.3);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.min-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.3));
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

@media (max-width: 520px) {
  .panel-wrapper {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
  }
  
  .panel-wrapper.minimized {
    width: auto;
  }
}
    `;
    this.shadow.appendChild(style);

    const panelHTML = `
<div class="panel-wrapper${this.isMinimized ? ' minimized' : ''}">
  <div class="panel">
    <div class="header">
      <div class="title">${this.t.title}</div>
      <div class="header-controls">
        <button class="lang-btn" id="lang-btn">
          <span>🌐</span>
          <span>${this.currentLanguage.toUpperCase()}</span>
        </button>
        <button class="minmax-btn" id="minmax-btn">
          <span>-</span>
        </button>
      </div>
    </div>

    <div class="content${this.isMinimized ? ' minimized-hidden' : ''}">
      <div class="status-card">
        <div class="status-content">
          <div class="status-dot-wrapper">
            <div class="status-dot-ring"></div>
            <div class="status-dot info" id="status-dot"></div>
          </div>
          <div class="status-text" id="status-text">${this.t.waitingCaptcha}</div>
        </div>
      </div>

      <div class="slider-section" id="slider-section">
        <div class="slider-header">
          <span class="slider-label">${this.t.redirectDelay}</span>
          <span class="slider-value" id="slider-value">${this.selectedDelay}s</span>
        </div>

        <div class="slider-track">
          <input type="range" min="0" max="60" value="${this.selectedDelay}" class="slider" id="delay-slider">
        </div>

        <button class="start-btn" id="start-btn">
          ${this.t.startRedirect}
        </button>
      </div>
    </div>

    <div class="footer${this.isMinimized ? ' minimized-hidden' : ''}">
      <div class="footer-content">
        <div class="version">${this.t.version}</div>
        <div class="credit">${this.t.madeBy}</div>
        <div class="links">
          <a href="https://www.youtube.com/@dyydeptry" target="_blank" class="link-btn">
            <span>📺</span> YouTube
          </a>
          <a href="https://discord.gg/DWyEfeBCzY" target="_blank" class="link-btn">
            <span>💬</span> Discord
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = panelHTML;
    this.shadow.appendChild(wrapper.firstElementChild);

    this.statusText = this.shadow.querySelector('#status-text');
    this.statusDot = this.shadow.querySelector('#status-dot');
    this.statusRing = this.shadow.querySelector('.status-dot-ring');
    this.sliderContainer = this.shadow.querySelector('#slider-section');
    this.sliderValue = this.shadow.querySelector('#slider-value');
    this.slider = this.shadow.querySelector('#delay-slider');
    this.startBtn = this.shadow.querySelector('#start-btn');
    this.langBtn = this.shadow.querySelector('#lang-btn');
    this.minMaxBtn = this.shadow.querySelector('#minmax-btn');

    this.updateStatus(this.t.waitingCaptcha, 'info');

    document.documentElement.appendChild(this.container);
    this.updateSliderProgress();
  }

  setupEventListeners() {
    this.slider.addEventListener('input', (e) => {
      this.selectedDelay = parseInt(e.target.value, 10);
      this.sliderValue.textContent = `${this.selectedDelay}s`;
      localStorage.setItem('workink_delay', String(this.selectedDelay));
      this.updateSliderProgress();
    });

    this.startBtn.addEventListener('click', () => {
      if (this.redirectInProgress) return;
      
      if (this.onStartCallback) {
        this.redirectInProgress = true;
        this.onStartCallback(this.selectedDelay);
      }
    });

    this.langBtn.addEventListener('click', () => {
      this.currentLanguage = this.currentLanguage === 'en' ? 'vi' : 'en';
      localStorage.setItem('lang', this.currentLanguage);
      this.t = translations[this.currentLanguage];
      this.updateLanguage();
    });

    this.minMaxBtn.addEventListener('click', () => {
      this.toggleMinimize();
    });
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    localStorage.setItem('workink_minimized', String(this.isMinimized));
    
    const panelWrapper = this.shadow.querySelector('.panel-wrapper');
    const content = this.shadow.querySelector('.content');
    const footer = this.shadow.querySelector('.footer');
    
    if (this.isMinimized) {
      panelWrapper.classList.add('minimized');
      content.classList.add('minimized-hidden');
      footer.classList.add('minimized-hidden');
      this.minMaxBtn.innerHTML = '<span>-</span>';
    } else {
      panelWrapper.classList.remove('minimized');
      content.classList.remove('minimized-hidden');
      footer.classList.remove('minimized-hidden');
      this.minMaxBtn.innerHTML = '<span>-</span>';
    }
  }

  applyMinimizedState() {
    const content = this.shadow.querySelector('.content');
    const footer = this.shadow.querySelector('.footer');
    
    if (content) content.classList.add('minimized-hidden');
    if (footer) footer.classList.add('minimized-hidden');
  }

  updateLanguage() {
    const langBtnText = this.langBtn.querySelector('span:last-child');
    const sliderLabel = this.shadow.querySelector('.slider-label');
    const startBtn = this.shadow.querySelector('#start-btn');
    const version = this.shadow.querySelector('.version');
    const credit = this.shadow.querySelector('.credit');
    const statusText = this.shadow.querySelector('#status-text');
    const sliderValue = this.shadow.querySelector('#slider-value');

    if (langBtnText) langBtnText.textContent = this.currentLanguage.toUpperCase();
    if (sliderLabel) sliderLabel.textContent = this.t.redirectDelay;
    if (startBtn) startBtn.textContent = this.t.startRedirect;
    if (version) version.textContent = this.t.version;
    if (credit) credit.textContent = this.t.madeBy;
    if (sliderValue) sliderValue.textContent = `${this.selectedDelay}s`;
    
    this.minMaxBtn.title = this.isMinimized ? this.t.maximize : this.t.minimize;

    if (statusText) {
      const currentText = statusText.textContent;
      if (currentText.includes('Waiting') || currentText.includes('Đang chờ')) {
        statusText.textContent = this.t.waitingCaptcha;
      } else if (currentText.includes('monetization') || currentText.includes('Đang xử lý') || currentText.includes('Processing')) {
        statusText.textContent = this.t.processingMonetizations;
      } else if (currentText.includes('social') || currentText.includes('xã hội')) {
        const match = currentText.match(/\d+\/\d+/);
        if (match) {
          statusText.textContent = `${this.t.processingSocials}: ${match[0]}`;
        } else {
          statusText.textContent = this.t.processingSocials;
        }
      } else if (currentText.includes('complete') || currentText.includes('hoàn tất')) {
        statusText.textContent = this.t.bypassComplete;
      } else if (currentText.match(/\d+s\.\.\./)) {
        const match = currentText.match(/\d+/);
        if (match) {
          statusText.textContent = `${this.t.redirectingIn} ${match[0]}s...`;
        }
      } else if (currentText.includes('now') || currentText.includes('chuyển hướng...')) {
        statusText.textContent = this.t.redirectingNow;
      }
    }
  }

  updateSliderProgress() {
    const progress = (this.selectedDelay / 60) * 100;
    const track = this.shadow.querySelector('.slider-track');
    if (track) {
      track.style.setProperty('--slider-progress', `${progress}%`);
    }
  }

  updateStatus(messageOrKey, type = 'info', isKey = false) {
    if (isKey) {
      this.currentStatusKey = messageOrKey;
      this.statusText.textContent = this.t[messageOrKey] || messageOrKey;
    } else {
      this.statusText.textContent = messageOrKey;
    }

    if (this.statusDot) {
      this.statusDot.className = `status-dot ${type}`;
    }

    const color = this.statusColors[type] || this.statusColors.info;

    if (this.statusRing) {
      this.statusRing.style.borderColor = color;
      this.statusRing.style.boxShadow = `0 0 12px ${color}`;
    }
  }

  showSlider() {
    if (this.redirectInProgress) return;
    
    // Auto-maximize when slider becomes active
    if (this.isMinimized) {
      this.toggleMinimize();
    }
    
    this.sliderContainer.classList.add('active');
    this.updateStatus(this.t.bypassComplete, 'success');
  }

  startCountdown(seconds) {
    const sliderHeader = this.shadow.querySelector('.slider-header');
    const sliderTrack = this.shadow.querySelector('.slider-track');
    
    if (sliderHeader) sliderHeader.style.display = 'none';
    if (sliderTrack) sliderTrack.style.display = 'none';
    if (this.startBtn) this.startBtn.style.display = 'none';

    let remaining = Math.max(0, parseInt(seconds, 10) || 0);
    
    const updateCountdown = () => {
      if (remaining > 0) {
        this.updateStatus(`${this.t.redirectingIn} ${remaining}s...`, 'bypassing');
      } else {
        this.updateStatus(this.t.redirectingNow, 'success');
      }
    };

    updateCountdown();
    
    const interval = setInterval(() => {
      remaining--;
      updateCountdown();
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
  }

  setCallback(callback) {
    this.onStartCallback = callback;
  }
}

// ==================== MAIN BYPASS LOGIC ====================
const log = {
    stylePrefix: "color: #ffac79ff; font-weight: bold; padding: 2px 5px; border-radius: 4px;",
    debug: (task, data = "") => {
        console.log(`%c[DEBUG]`, log.stylePrefix, task, data);
    },
    info: (task, data = "") => {
        console.log(`%c[INFO]`, log.stylePrefix, task, data);
    },
    error: (task, err = "") => {
        console.log(`%c[ERROR]`, log.stylePrefix, task, err);
    },
    method: (name, obj1, obj2) => {
        console.log(`%c[METHOD]`, log.stylePrefix, name, obj1, obj2);
    },
};

const host = location.hostname;
let panel = null;

try {
    panel = new BypassPanel();
} catch (e) {
    console.error('Failed to create panel:', e);
}

function deleteCookie(url, cookieName) {
    window.postMessage({
        type: "FROM_INJECTED_SCRIPT",
        action: "REMOVE_COOKIE",
        payload: { url: url, name: cookieName }
    }, "*");
}

if (host.includes("work.ink")) {
    handleWorkInk();
}

function handleWorkInk() {
    let sessionController = undefined;
    let sendMessage = undefined;
    let sendMessageProxy = undefined;
    let LinkInfo = undefined;
    let LinkDestination = undefined;
    let bypassTriggered = false;
    let destinationReceived = false;
    let destinationProcessed = false;
    let socialPage = false;
    let captchaSolved = false;

    const map = {
        onLI: ["onLinkInfo"],
        onLD: ["onLinkDestination"],
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
        an: "c_announce",
        mo: "c_monetization",
        ss: "c_social_started",
        rr: "c_recaptcha_response",
        hr: "c_hcaptcha_response",
        tr: "c_turnstile_response",
        ad: "c_adblocker_detected",
        fl: "c_focus_lost",
        os: "c_offers_skipped",
        ok: "c_offer_skipped",
        fo: "c_focus",
        wp: "c_workink_pass_available",
        wu: "c_workink_pass_use",
        pi: "c_ping",
        kk: "c_keyapp_key",
        mc: "c_monocle",
        bd: "c_bot_detected",
    };

    deleteCookie("https://work.ink/", "cf_clearance");

    function triggerBypass(reason) {
        if (bypassTriggered) return;
        bypassTriggered = true;
        captchaSolved = true;
        log.info("Trigger Bypass via:", reason);
        if (panel) panel.updateStatus('Bypassing...', 'bypassing');
        spoofWorkink();
    }

    async function waitForWebSocket(maxRetries = 15, delayMs = 500) {
        let retries = 0;
        while (retries < maxRetries) {
            if (sessionController?.websocket?.readyState === WebSocket.OPEN) {
                return true;
            }
            log.debug(`Waiting for WebSocket... (${retries + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            retries++;
        }
        return false;
    }

    function spoofWorkink() {
        if (!sessionController?.linkInfo) {
            log.debug("No linkInfo yet, skipping...");
            return;
        }

        const socials = sessionController.linkInfo.socials || [];
        log.info("Total Socials: ", socials.length);

        if (socials.length > 0) {
            (async () => {
                let successCount = 0;

                const wsReady = await waitForWebSocket();
                if (!wsReady) {
                    log.error("WebSocket not ready, skipping social bypass");
                    await proceedToMonetizations();
                    return;
                }

                for (let i = 0; i < socials.length; i++) {
                    const soc = socials[i];
                    try {
                        if (sendMessageProxy && sessionController) {
                            const payload = { url: soc.url };
                            
                            if (panel) {
                                panel.updateStatus(`Processing socials: ${i + 1}/${socials.length}`, 'social');
                            }

                            log.debug(`Sending social spoof [${i + 1}/${socials.length}]`, {
                                type: types.ss,
                                payload: payload,
                                wsState: sessionController.websocket?.readyState,
                            });
                            
                            for (let attempt = 0; attempt < 3; attempt++) {
                                sendMessageProxy.call(sessionController, types.ss, payload);
                                await new Promise((resolve) => setTimeout(resolve, 200));
                            }
                            successCount++;
                            await new Promise((resolve) => setTimeout(resolve, 800));
                        }
                    } catch (e) {
                        log.error(`Social bypass failed [${i + 1}/${socials.length}]:`, e);
                    }
                }

                if (socials.length > 1) {
                    log.info("Multiple socials completed, reloading...");
                    if (panel) panel.updateStatus('Reloading page...', 'info');
                    setTimeout(() => {
                        socialPage = false;
                        window.location.reload();
                    }, 5000);
                }

                log.info(`Social bypass completed: ${successCount}/${socials.length}`);
                proceedToMonetizations();
            })();
        } else {
            log.info("No socials to process, going to monetizations...");
            socialPage = false;
            proceedToMonetizations();
        }
    }

    async function proceedToMonetizations() {
        log.info("Proceeding to monetizations...");
        if (panel && captchaSolved) {
            panel.updateStatus('processingMonetizations', 'bypassing', true);
        }
        await handleMonetizations();
    }

    function injectBrowserExtensionSupport() {
        if (window._browserExt2BypassInjected) return;

        if (!window.chrome) window.chrome = {};
        if (!window.chrome.runtime) window.chrome.runtime = {};

        const originalSendMessage = window.chrome.runtime.sendMessage;
        window.chrome.runtime.sendMessage = function (extensionId, message, callback) {
            if (message?.message === "wk_installed") {
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

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            try {
                const nodeId = node.id;
                const nodeSendMessage = node.sendMessage;
                log.info(`Processing monetization [${i + 1}/${nodes.length}]:`, { id: nodeId, name: node.name });

                sendMessageProxy.call(sessionController, types.ok, { offerId: nodeId });
                sendMessageProxy.call(sessionController, types.os, {});

                switch (nodeId) {
                    case 22:
                        nodeSendMessage.call(node, { event: "read" });
                        break;
                    case 23:
                        nodeSendMessage.call(node, { event: "start" });
                        await sleep(300);
                        nodeSendMessage.call(node, { event: "installClicked" });
                        break;
                    case 25:
                        nodeSendMessage.call(node, { event: "start" });
                        await sleep(300);
                        nodeSendMessage.call(node, { event: "installClicked" });
                        fetch("/_api/v2/affiliate/operaGX", { method: "GET", mode: "no-cors" }).catch(() => {});
                        await sleep(2000);
                        nodeSendMessage.call(node, { event: "done" });
                        fetch("https://work.ink/_api/v2/callback/operaGX", {
                            method: "POST",
                            mode: "no-cors",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ noteligible: true }),
                        }).catch(() => {});
                        await sleep(2000);
                        setInterval(() => {
                            if (!destinationReceived) {
                                fetch("https://work.ink/_api/v2/callback/operaGX", {
                                    method: "POST",
                                    mode: "no-cors",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ noteligible: true }),
                                }).catch(() => {});
                            }
                        }, 2000);
                        break;
                    case 73:
                        nodeSendMessage.call(node, { event: "start" });
                        await sleep(300);
                        nodeSendMessage.call(node, { event: "installClicked" });
                        break;
                    case 27:
                    case 28:
                        nodeSendMessage.call(node, { event: "start" });
                        await sleep(300);
                        nodeSendMessage.call(node, { event: "installClicked" });
                        break;
                    case 29:
                    case 36:
                    case 57:
                        nodeSendMessage.call(node, { event: "installed" });
                        break;
                    case 32:
                    case 34:
                        nodeSendMessage.call(node, { event: "start" });
                        await sleep(300);
                        nodeSendMessage.call(node, { event: "installClicked" });
                        break;
                    case 40:
                        nodeSendMessage.call(node, { event: "start" });
                        await sleep(300);
                        nodeSendMessage.call(node, { event: "installClicked" });
                        break;
                    case 60:
                        nodeSendMessage.call(node, { event: "start" });
                        await sleep(300);
                        nodeSendMessage.call(node, { event: "installClicked" });
                        break;
                    case 62:
                    case 65:
                    case 70:
                    case 71:
                        nodeSendMessage.call(node, { event: "start" });
                        await sleep(300);
                        nodeSendMessage.call(node, { event: "installClicked" });
                        break;
                    default:
                        log.info("Unknown monetization ID:", nodeId);
                        break;
                }

                await sleep(500);
            } catch (e) {
                log.error("Failed to process node:", node.id, e);
            }
        }
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    let totalDiv = 0;

    function handleUIElements() {
        if (socialPage) return;

        const accessDiv = document.querySelector("div.bg-white.rounded-2xl.w-full.max-w-md.relative.shadow-2xl.animate-fade-in");
        if (accessDiv) accessDiv.remove();

        const modalDiv = document.querySelector("div.fixed.inset-0.bg-black\\/50.backdrop-blur-sm.flex.items-center.justify-center.p-4.main-modal.svelte-9kfsb0");
        if (modalDiv) modalDiv.remove();

        const googleDiv = document.querySelector("div.fixed.top-16.left-0.right-0.bottom-0.bg-white.z-40.overflow-y-auto");
        if (googleDiv) {
            googleDiv.remove();
            triggerBypass("captcha");
        }

        const GTDiv = document.querySelector("div.button.large.accessBtn.pos-relative");
        if (GTDiv && totalDiv < 3) {
            if (GTDiv.classList.contains("button-disabled")) {
                GTDiv.classList.remove("button-disabled");
            }
            try {
                GTDiv.click();
                totalDiv++;
            } catch (e) {
                log.error("Failed to click GTD button:", e);
            }
        }

        setTimeout(handleUIElements, 1);
    }

    function createSendMessage() {
        return function (...args) {
            const packet_type = args[0];
            const packet_data = args[1];

            if (packet_type !== types.pi) {
                log.method("📤 Packet sent:", packet_type, packet_data);
            }

            const captchaResponses = [types.tr, types.hr, types.rr];

            for (let i = 0; i < captchaResponses.length; i++) {
                const captchaResponse = captchaResponses[i];
                if (packet_type === captchaResponse) {
                    log.info("🔓 Captcha response detected, handling UI...");
                    const ret = sendMessage.apply(this, args);
                    handleUIElements();
                    return ret;
                }
            }

            if (packet_type === types.kk) {
                log.info("🔑 KeyApp key detected");
                const verifyForm = document.querySelector('form input[maxlength="6"]')?.closest("form");
                if (verifyForm) {
                    const submitBtn = verifyForm.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.disabled = false;
                    setTimeout(() => triggerBypass("keyapp"), 1000);
                }
            }

            return sendMessage.apply(this, args);
        };
    }

    function createLinkInfo() {
        return async function (...args) {
            const [info] = args;
            log.info("Link info:", info);
            spoofWorkink();
            try {
                Object.defineProperty(info, "isAdblockEnabled", {
                    get: () => false,
                    set: () => {},
                    configurable: false,
                    enumerable: true,
                });
            } catch (e) {
                log.error("Failed to override adblock detection:", e);
            }

            return LinkInfo.apply(this, args);
        };
    }

    function createLinkDestination() {
        return async function (...args) {
            const [data] = args;
            destinationReceived = true;
            log.info("Link Destination: ", data);

            if (!destinationProcessed && data?.url) {
                destinationProcessed = true;

                if (panel) {
                    panel.showSlider();

                    panel.setCallback((delay) => {
                        if (!data.url) {
                            log.error('No destination URL to redirect to');
                            return;
                        }

                        log.info(`Starting redirect with ${delay}s delay to: ${data.url}`);

                        if (panel) {
                            panel.startCountdown(delay);
                        }
                    });
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

        log.method("Send Message:", send);
        log.method("Link Info:", info);
        log.method("Link Destination:", dest);

        sendMessage = send.fn;
        LinkInfo = info.fn;
        LinkDestination = dest.fn;

        sendMessageProxy = createSendMessage();
        const LinkInfoProxy = createLinkInfo();
        const LinkDestinationProxy = createLinkDestination();

        try {
            Object.defineProperty(sessionController, send.name, {
                get() {
                    return sendMessageProxy;
                },
                set(v) {
                    sendMessage = v;
                },
                configurable: false,
                enumerable: true,
            });
            Object.defineProperty(sessionController, info.name, {
                get() {
                    return LinkInfoProxy;
                },
                set(v) {
                    LinkInfo = v;
                },
                configurable: false,
                enumerable: true,
            });
            Object.defineProperty(sessionController, dest.name, {
                get() {
                    return LinkDestinationProxy;
                },
                set(v) {
                    LinkDestination = v;
                },
                configurable: false,
                enumerable: true,
            });

            log.debug("SessionController proxies installed successfully");
        } catch (e) {
            log.error("Failed to setup proxies:", e);
        }
    }

    function checkController(target, prop, value, receiver) {
        if (
            value &&
            typeof value === "object" &&
            getName(value).fn &&
            getName(value, map.onLI).fn &&
            getName(value, map.onLD).fn &&
            !sessionController
        ) {
            sessionController = value;
            log.info("Intercepted session controller:", sessionController);
            setupProxies();
        }
        return Reflect.set(target, prop, value, receiver);
    }

    function createComponentProxy(component) {
        return new Proxy(component, {
            construct(target, args) {
                const result = Reflect.construct(target, args);
                log.info("Intercepted SvelteKit component construction");

                result.$$.ctx = new Proxy(result.$$.ctx, {
                    set: checkController,
                });

                return result;
            },
        });
    }

    function createNodeResultProxy(result) {
        return new Proxy(result, {
            get(target, prop, receiver) {
                if (prop === "component") {
                    return createComponentProxy(target.component);
                }
                return Reflect.get(target, prop, receiver);
            },
        });
    }

    function createNodeProxy(oldNode) {
        return async (...args) => {
            const result = await oldNode(...args);
            log.info("Intercepted SvelteKit node result");
            return createNodeResultProxy(result);
        };
    }

    function createKitProxy(kit) {
        if (typeof kit !== "object" || !kit) return [false, kit];

        const originalStart = "start" in kit && kit.start;
        if (!originalStart) return [false, kit];

        const kitProxy = new Proxy(kit, {
            get(target, prop, receiver) {
                if (prop === "start") {
                    return function (...args) {
                        const appModule = args[0];
                        const options = args[2];

                        if (
                            typeof appModule === "object" &&
                            typeof appModule.nodes === "object" &&
                            typeof options === "object" &&
                            typeof options.node_ids === "object"
                        ) {
                            const oldNode = appModule.nodes[options.node_ids[1]];
                            appModule.nodes[options.node_ids[1]] = createNodeProxy(oldNode);
                        }

                        log.info("kit.start intercepted!");
                        return originalStart.apply(this, args);
                    };
                }
                return Reflect.get(target, prop, receiver);
            },
        });

        return [true, kitProxy];
    }

    function setupInterception() {
        const originalPromiseAll = Promise.all;
        let intercepted = false;

        Promise.all = async function (promises) {
            const result = originalPromiseAll.call(this, promises);

            if (!intercepted) {
                return await new Promise((resolve) => {
                    result.then(([kit, app, ...args]) => {
                        log.info("SvelteKit modules loaded");

                        const [success, wrappedKit] = createKitProxy(kit);
                        if (success) {
                            intercepted = true;
                            Promise.all = originalPromiseAll;
                            log.info("Wrapped kit ready");
                        }

                        resolve([wrappedKit, app, ...args]);
                    });
                });
            }

            return await result;
        };
    }

    setupInterception();

    // Hide ads and unwanted elements
    const hide = 'W2lkXj0iYnNhLXpvbmVfIl0sCmRpdi5maXhlZC5pbnNldC0wLmJnLWJsYWNrXC81MC5iYWNrZHJvcC1ibHVyLXNtLApkaXYuZG9uZS1iYW5uZXItY29udGFpbmVyLnN2ZWx0ZS0xeWptazFnLAppbnM6bnRoLW9mLXR5cGUoMSksCmRpdjpudGgtb2YtdHlwZSg5KSwKZGl2LmZpeGVkLnRvcC0xNi5sZWZ0LTAucmlnaHQtMC5ib3R0b20tMC5iZy13aGl0ZS56LTQwLm92ZXJmbG93LXktYXV0bywKcFtzdHlsZV0sCi5hZHNieWdvb2dsZSwKLmFkc2Vuc2Utd3JhcHBlciwKLmlubGluZS1hZCwKLmdwdC1iaWxsYm9hcmQtY29udGFpbmVyLAojYmlsbGJvYXJkLTEsCiNiaWxsYm9hcmQtMiwKI2JpbGxib2FyZC0zLAojc2lkZWJhci1hZC0xLAojc2t5c2NyYXBlci1hZC0xLApkaXYubGdcOmJsb2NrIHsKICAgIGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsKfQ==';

    const style = document.createElement('style');
    style.textContent = (typeof atob === 'function') ? atob(hide) : '';
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
