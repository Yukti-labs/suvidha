// Floating "✦ Tell Suvidha" Assistant & Contextual Tool Suggestions
import { resolveRequirement } from './search.js';
import { getToolIcon } from './config.js';
import { analytics } from './analytics.js';

// Contextual suggestions per tool
const CONTEXTUAL_SUGGESTIONS = {
  'image-compressor': [
    { label: 'Make under 50 KB', query: 'Make my photo under 50 KB' },
    { label: 'Make under 100 KB', query: 'Make my photo under 100 KB' },
    { label: 'Convert image to PDF', query: 'Convert photos to PDF' },
    { label: 'Compress another image', query: 'Compress image' }
  ],
  'pdf-compressor': [
    { label: 'Merge PDFs', query: 'Merge PDFs' },
    { label: 'Unlock a PDF', query: 'Unlock PDF' },
    { label: 'Compress another PDF', query: 'Compress my PDF' }
  ],
  'image-to-pdf': [
    { label: 'Compress resulting PDF', query: 'Make my PDF smaller than 1 MB' },
    { label: 'Compress photos first', query: 'Make photo under 100 KB' }
  ],
  'emi-calculator': [
    { label: 'Calculate GST', query: 'Calculate GST tax' },
    { label: 'SIP investment returns', query: 'SIP returns calculator' }
  ],
  'json-formatter': [
    { label: 'Validate JSON', query: 'Validate JSON syntax' },
    { label: 'Convert JSON to CSV', query: 'Convert JSON to CSV' }
  ],
  'resume-builder': [
    { label: 'Compress resume PDF', query: 'Make my PDF smaller than 1 MB' }
  ]
};

const DEFAULT_SUGGESTIONS = [
  { label: 'PDF under 1 MB', query: 'Make my PDF smaller than 1 MB' },
  { label: 'Photo under 100 KB', query: 'Make my photo under 100 KB' },
  { label: 'Photos to PDF', query: 'Combine photos into one PDF' },
  { label: 'Calculate EMI', query: 'Calculate my home loan EMI' },
  { label: 'Beautify JSON', query: 'Make this JSON readable' },
  { label: 'Create QR code', query: 'Create a QR code' }
];

let modalEl = null;
let previousActiveElement = null;

export function getContextSuggestions(toolSlug = '') {
  if (toolSlug && CONTEXTUAL_SUGGESTIONS[toolSlug]) {
    return CONTEXTUAL_SUGGESTIONS[toolSlug];
  }
  return DEFAULT_SUGGESTIONS;
}

export function openTellSuvidhaModal({ toolSlug = '', initialQuery = '' } = {}) {
  analytics.tellSuvidhaOpened();

  try {
    previousActiveElement = document.activeElement;
  } catch (e) {
    previousActiveElement = null;
  }

  if (!modalEl) {
    createModalDOM();
  }

  const overlay = modalEl;
  const input = overlay.querySelector('#floatingTellInput');
  const card = overlay.querySelector('#floatingTellCard');
  const chipsContainer = overlay.querySelector('#floatingTellChips');
  const eyebrow = overlay.querySelector('#floatingTellEyebrow');

  // Populate contextual chips
  const suggestions = getContextSuggestions(toolSlug);
  if (toolSlug && CONTEXTUAL_SUGGESTIONS[toolSlug]) {
    eyebrow.textContent = 'What would you like to do next?';
  } else {
    eyebrow.textContent = 'Tell Suvidha what you need';
  }

  chipsContainer.innerHTML = suggestions.map(s => `
    <button type="button" class="floating-tell-chip" data-query="${s.query}">${s.label}</button>
  `).join('');

  chipsContainer.querySelectorAll('.floating-tell-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.query;
      input.value = q;
      handleFloatingRequirement(q);
    });
  });

  card.style.display = 'none';
  input.value = initialQuery || '';

  overlay.classList.add('is-open');
  try {
    window.dispatchEvent(new CustomEvent('suvidha:tell-modal-open', { detail: { toolSlug } }));
  } catch (e) {}

  requestAnimationFrame(() => {
    input.focus();
    if (initialQuery) handleFloatingRequirement(initialQuery);
  });
}

export function closeTellSuvidhaModal() {
  if (modalEl) {
    modalEl.classList.remove('is-open');
    try {
      window.dispatchEvent(new CustomEvent('suvidha:tell-modal-close'));
    } catch (e) {}
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      try {
        previousActiveElement.focus();
      } catch (e) {}
      previousActiveElement = null;
    }
  }
}

function handleFloatingRequirement(query) {
  if (!modalEl) return;
  const card = modalEl.querySelector('#floatingTellCard');
  const q = (query || '').trim();

  if (!q) {
    card.style.display = 'none';
    return;
  }

  const result = resolveRequirement(q);

  if (result.type === 'confident') {
    card.style.display = 'block';
    const toolSlug = result.tool.url.split('/').pop().replace('.html', '');
    
    card.innerHTML = `
      <div class="recommend-box">
        <div class="recommend-top">
          <span class="recommend-badge">I think you need</span>
          <button type="button" class="recommend-close" id="floatingCardDismiss" aria-label="Dismiss">✕</button>
        </div>
        <div class="recommend-content">
          <div class="recommend-icon">${getToolIcon(result.tool.iconName)}</div>
          <div class="recommend-details">
            <strong class="recommend-name">${result.tool.name}</strong>
            <div class="recommend-sub">
              ${result.targetParam ? `<span class="recommend-target-pill">Target: <strong>${result.targetParam.label}</strong></span>` : ''}
              <span>${result.tool.shortDesc}</span>
            </div>
          </div>
          <a href="${result.url}" class="recommend-cta" id="floatingCardOpen">
            <span>Open ${result.tool.name}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    `;

    card.querySelector('#floatingCardDismiss').addEventListener('click', () => { card.style.display = 'none'; });
    card.querySelector('#floatingCardOpen').addEventListener('click', () => {
      analytics.tellSuvidhaRoute(toolSlug);
      closeTellSuvidhaModal();
    });
  } else if (result.type === 'ambiguous') {
    card.style.display = 'block';
    card.innerHTML = `
      <div class="recommend-box is-ambiguous">
        <div class="recommend-top">
          <span class="recommend-badge">${result.message}</span>
          <button type="button" class="recommend-close" id="floatingCardDismiss" aria-label="Dismiss">✕</button>
        </div>
        <div class="recommend-choices">
          ${result.matches.map(m => `
            <a href="${m.url}" class="recommend-choice-item" data-tool-slug="${m.url.split('/').pop().replace('.html', '')}">
              <div class="recommend-choice-icon">${getToolIcon(m.iconName)}</div>
              <div class="recommend-choice-info">
                <strong>${m.name}</strong>
                <small>${m.shortDesc}</small>
              </div>
              <span class="recommend-choice-arrow">→</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;
    card.querySelector('#floatingCardDismiss').addEventListener('click', () => { card.style.display = 'none'; });
    card.querySelectorAll('.recommend-choice-item').forEach(el => {
      el.addEventListener('click', () => {
        const slug = el.dataset.toolSlug;
        if (slug) analytics.tellSuvidhaRoute(slug);
        closeTellSuvidhaModal();
      });
    });
  } else {
    card.style.display = 'block';
    card.innerHTML = `
      <div class="recommend-box is-empty">
        <div class="recommend-top">
          <span class="recommend-badge" style="color:var(--muted)">Need help finding a tool?</span>
          <button type="button" class="recommend-close" id="floatingCardDismiss" aria-label="Dismiss">✕</button>
        </div>
        <p class="recommend-empty-msg">${result.message}</p>
      </div>
    `;
    card.querySelector('#floatingCardDismiss').addEventListener('click', () => { card.style.display = 'none'; });
  }
}

function createModalDOM() {
  const overlay = document.createElement('div');
  overlay.id = 'floatingTellModal';
  overlay.className = 'floating-tell-overlay';
  overlay.innerHTML = `
    <div class="floating-tell-dialog" role="dialog" aria-modal="true" aria-labelledby="floatingTellEyebrow">
      <div class="floating-tell-head">
        <div class="floating-tell-title-wrap">
          <span class="floating-tell-eyebrow" id="floatingTellEyebrow">Tell Suvidha what you need</span>
          <small class="floating-tell-sub">Processed directly in your browser · Files aren't uploaded to Suvidha's servers</small>
        </div>
        <button type="button" class="floating-tell-close" id="floatingTellCloseBtn" aria-label="Close assistant">✕</button>
      </div>

      <form class="floating-tell-form" id="floatingTellForm">
        <div class="floating-tell-input-wrap">
          <span class="floating-tell-input-icon">✦</span>
          <input type="text" id="floatingTellInput" placeholder="e.g. Make my PDF smaller than 1 MB..." autocomplete="off" />
          <button type="submit" class="floating-tell-submit" aria-label="Find tool">Find tool →</button>
        </div>
      </form>

      <div class="floating-tell-card" id="floatingTellCard" style="display:none;" role="region" aria-live="polite"></div>

      <div class="floating-tell-chips-wrap">
        <span class="floating-tell-chips-label">Suggestions:</span>
        <div class="floating-tell-chips" id="floatingTellChips"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  modalEl = overlay;

  overlay.querySelector('#floatingTellCloseBtn').addEventListener('click', closeTellSuvidhaModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeTellSuvidhaModal();
  });

  const form = overlay.querySelector('#floatingTellForm');
  const input = overlay.querySelector('#floatingTellInput');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleFloatingRequirement(input.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeTellSuvidhaModal();
    }
  });
}

/**
 * Injects the floating button and initializes auto-triggers (e.g. ?tell=1).
 */
export function initFloatingTellSuvidha({ toolSlug = '' } = {}) {
  if (typeof window === 'undefined') return;

  // Check if ?tell=1 URL parameter is present
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tell') === '1') {
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          openTellSuvidhaModal({ toolSlug });
        }, 150);
      });
    }
  } catch {}

  if (document.getElementById('floatingTellTriggerBtn')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'floatingTellTriggerBtn';
  btn.className = 'floating-tell-btn';
  btn.setAttribute('aria-label', 'Tell Suvidha');
  btn.innerHTML = `
    <span class="floating-tell-icon">✦</span>
    <span class="floating-tell-label">Tell Suvidha</span>
  `;

  btn.addEventListener('click', () => {
    openTellSuvidhaModal({ toolSlug });
  });

  document.body.appendChild(btn);
}
