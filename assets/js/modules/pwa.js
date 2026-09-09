// Suvidha PWA Manager — Smart Install Experience & Standalone Detection
import { analytics } from './analytics.js';

let deferredInstallPrompt = null;
let isInstalled = false;

/**
 * Detects if app is running in standalone mode (already installed).
 */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Detects if current platform is iOS/iPadOS Safari.
 */
export function isIOS() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isApple = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|Chrome|EdgiOS/i.test(ua);
  return isApple && isSafari;
}

export function detectPlatform() {
  if (isIOS()) return 'ios';
  if (/Android/i.test(navigator.userAgent)) return 'android';
  if (/Win/i.test(navigator.userAgent)) return 'windows';
  if (/Mac/i.test(navigator.userAgent)) return 'macos';
  if (/CrOS/i.test(navigator.userAgent)) return 'chromeos';
  return 'other';
}

/**
 * Renders the accessible iOS 3-step installation sheet.
 */
export function showIOSInstallSheet() {
  if (document.getElementById('suvidha-ios-sheet')) {
    document.getElementById('suvidha-ios-sheet').classList.add('is-open');
    return;
  }

  const isTablet = /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const deviceName = isTablet ? 'iPad' : 'iPhone';

  const overlay = document.createElement('div');
  overlay.id = 'suvidha-ios-sheet';
  overlay.className = 'ios-sheet-overlay';
  overlay.innerHTML = `
    <div class="ios-sheet-dialog" role="dialog" aria-modal="true" aria-labelledby="iosSheetTitle">
      <div class="ios-sheet-head">
        <div class="ios-sheet-icon">
          <svg viewBox="0 0 256 256" width="32" height="32" fill="none">
            <rect width="256" height="256" rx="56" fill="#09090c"/>
            <path d="M55 162L128 89V162H55Z" stroke="url(#ios_g)" stroke-width="20" stroke-linejoin="round"/>
            <path d="M201 94H128V168L201 94Z" stroke="url(#ios_g)" stroke-width="20" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="ios_g" x1="44" y1="184" x2="216" y2="72" gradientUnits="userSpaceOnUse">
                <stop stop-color="#2BD79F"/><stop offset="0.52" stop-color="#2D7BE8"/><stop offset="1" stop-color="#8B2CF5"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="ios-sheet-title-wrap">
          <h3 id="iosSheetTitle">Install Suvidha on ${deviceName}</h3>
          <p>Add to your home screen for quick offline-ready access</p>
        </div>
        <button type="button" class="ios-sheet-close" id="closeIosSheet" aria-label="Close">✕</button>
      </div>

      <div class="ios-sheet-steps">
        <div class="ios-step">
          <span class="ios-step-num">1</span>
          <div class="ios-step-desc">
            Tap the <strong>Share</strong> button
            <svg class="ios-share-inline-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            in the Safari menu bar
          </div>
        </div>
        <div class="ios-step">
          <span class="ios-step-num">2</span>
          <div class="ios-step-desc">
            Scroll down and select <strong>Add to Home Screen</strong>
          </div>
        </div>
        <div class="ios-step">
          <span class="ios-step-num">3</span>
          <div class="ios-step-desc">
            Tap <strong>Add</strong> in the top-right corner
          </div>
        </div>
      </div>

      <div class="ios-sheet-foot">
        <button type="button" class="ios-sheet-btn" id="doneIosSheet">Got it</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.classList.remove('is-open');
  overlay.querySelector('#closeIosSheet').addEventListener('click', close);
  overlay.querySelector('#doneIosSheet').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  requestAnimationFrame(() => overlay.classList.add('is-open'));
}

/**
 * Triggers the install flow depending on browser capabilities.
 */
export async function triggerInstall() {
  analytics.installClicked(detectPlatform());

  if (isIOS()) {
    showIOSInstallSheet();
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      analytics.appInstalled();
      hideInstallButtons();
    }
    deferredInstallPrompt = null;
    return;
  }

  // Fallback for Chromium when prompt is already available via browser menu
  alert('To install Suvidha, open your browser menu (⋮) and select "Install Suvidha" or "Install App".');
}

function updateInstallButtonsVisibility() {
  const shouldShow = !isInstalled && !isStandalone() && (Boolean(deferredInstallPrompt) || isIOS());
  document.querySelectorAll('[data-pwa-install]').forEach(el => {
    el.style.display = shouldShow ? '' : 'none';
  });
}

export function hideInstallButtons() {
  isInstalled = true;
  document.querySelectorAll('[data-pwa-install]').forEach(el => {
    el.style.display = 'none';
  });
}

/**
 * Initializes PWA install hooks and service worker.
 */
export function initPWA({ serviceWorkerPath = '/sw.js' } = {}) {
  if (typeof window === 'undefined') return;

  // 1. Standalone Check
  if (isStandalone()) {
    isInstalled = true;
    hideInstallButtons();
  }

  // 2. Chromium beforeinstallprompt listener
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar or automatic dialog
    e.preventDefault();
    deferredInstallPrompt = e;
    updateInstallButtonsVisibility();
  });

  // 3. appinstalled listener
  window.addEventListener('appinstalled', () => {
    analytics.appInstalled();
    hideInstallButtons();
    deferredInstallPrompt = null;
    console.log('[PWA] Suvidha was successfully installed as an app.');
  });

  // 4. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(serviceWorkerPath, { scope: '/' })
        .then(reg => {
          console.debug('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch(err => {
          console.debug('[PWA] Service Worker registration skipped/failed:', err.message);
        });
    });
  }

  // Initial visibility update (e.g. for iOS Safari)
  updateInstallButtonsVisibility();

  // Bind click handlers to any install buttons with data-pwa-install
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pwa-install]');
    if (btn) {
      e.preventDefault();
      triggerInstall();
    }
  });
}
