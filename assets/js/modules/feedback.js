// Feedback & Suggestions System for Suvidha Tools
import { analytics } from './analytics.js';

const ALLOWED_TYPES = [
  'Suggestion',
  'Bug Report',
  'Feature Request',
  'General Feedback',
  'Other'
];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

let modalOverlayEl = null;
let previousActiveElement = null;
let isSubmitting = false;

/**
 * Validates feedback fields on the client.
 */
export function validateFeedbackForm({ type, message, name, email }) {
  const errors = {};

  // 1. Type
  if (!type || !ALLOWED_TYPES.includes(type.trim())) {
    errors.type = 'Please select a valid feedback type.';
  }

  // 2. Message
  const trimmedMessage = (message || '').trim();
  if (!trimmedMessage) {
    errors.message = 'Please enter your feedback.';
  } else if (trimmedMessage.length < 10) {
    errors.message = 'Feedback must be at least 10 characters.';
  } else if (trimmedMessage.length > 2000) {
    errors.message = 'Feedback cannot exceed 2000 characters.';
  }

  // 3. Name (Optional)
  if (name && name.trim().length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  }

  // 4. Email (Optional)
  if (email && email.trim().length > 0) {
    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 254) {
      errors.email = 'Email cannot exceed 254 characters.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Gets clean, privacy-safe page context without query parameters.
 */
export function getCleanPageContext() {
  if (typeof window === 'undefined') return 'Suvidha Tools';
  try {
    const pathname = window.location.pathname;
    const toolTitle = document.title ? document.title.split('—')[0].trim() : '';
    return `${window.location.origin}${pathname}${toolTitle ? ` (${toolTitle})` : ''}`;
  } catch {
    return 'Suvidha Tools';
  }
}

/**
 * Injects feedback modal DOM structure into document.body.
 */
function createModalDOM() {
  if (document.getElementById('suvidhaFeedbackOverlay')) {
    modalOverlayEl = document.getElementById('suvidhaFeedbackOverlay');
    return modalOverlayEl;
  }

  const modalHtml = `
    <div class="feedback-modal-overlay" id="suvidhaFeedbackOverlay" role="dialog" aria-modal="true" aria-labelledby="feedbackModalTitle" aria-describedby="feedbackModalDesc">
      <div class="feedback-modal-dialog" id="suvidhaFeedbackDialog">
        <div class="feedback-modal-header">
          <div class="feedback-modal-header-copy">
            <h2 class="feedback-modal-title" id="feedbackModalTitle">Help improve Suvidha</h2>
            <p class="feedback-modal-desc" id="feedbackModalDesc">Found something that could be better? Share your feedback, suggestion, or report a problem.</p>
          </div>
          <button type="button" class="feedback-modal-close" id="feedbackModalClose" aria-label="Close feedback modal">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="feedback-modal-body" id="feedbackModalBody">
          <!-- Global Error Alert -->
          <div class="feedback-global-error" id="feedbackGlobalError" role="alert" style="display: none;">
            Couldn't send your feedback right now. Please try again.
          </div>

          <form id="suvidhaFeedbackForm" novalidate>
            <!-- Feedback Type -->
            <div class="feedback-field-group">
              <label for="feedbackTypeInput" class="feedback-label">
                Feedback type <span class="feedback-req-star" aria-hidden="true">*</span>
              </label>
              <select id="feedbackTypeInput" name="type" class="feedback-select" required aria-required="true" aria-describedby="feedbackTypeError">
                <option value="Suggestion" selected>Suggestion</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Feedback">General Feedback</option>
                <option value="Other">Other</option>
              </select>
              <div class="feedback-field-error" id="feedbackTypeError" role="alert"></div>
            </div>

            <!-- Feedback Message -->
            <div class="feedback-field-group">
              <div class="feedback-label-row">
                <label for="feedbackMessageInput" class="feedback-label">
                  Your feedback <span class="feedback-req-star" aria-hidden="true">*</span>
                </label>
                <span class="feedback-char-count" id="feedbackCharCount">0/2000</span>
              </div>
              <textarea
                id="feedbackMessageInput"
                name="message"
                class="feedback-textarea"
                rows="4"
                placeholder="Tell us what you think..."
                required
                aria-required="true"
                minlength="10"
                maxlength="2000"
                aria-describedby="feedbackMessageError"
              ></textarea>
              <div class="feedback-field-error" id="feedbackMessageError" role="alert"></div>
            </div>

            <!-- Name (Optional) -->
            <div class="feedback-field-group">
              <label for="feedbackNameInput" class="feedback-label">Name (optional)</label>
              <input
                type="text"
                id="feedbackNameInput"
                name="name"
                class="feedback-input"
                placeholder="Your name"
                maxlength="100"
                aria-describedby="feedbackNameError"
              >
              <div class="feedback-field-error" id="feedbackNameError" role="alert"></div>
            </div>

            <!-- Email (Optional) -->
            <div class="feedback-field-group">
              <label for="feedbackEmailInput" class="feedback-label">Email (optional)</label>
              <input
                type="email"
                id="feedbackEmailInput"
                name="email"
                class="feedback-input"
                placeholder="you@example.com"
                maxlength="254"
                aria-describedby="feedbackEmailHelper feedbackEmailError feedbackEmailPrivacy"
              >
              <p class="feedback-helper-text" id="feedbackEmailHelper">Add your email if you'd like a reply.</p>
              <p class="feedback-email-privacy" id="feedbackEmailPrivacy" style="display: none;">We'll only use your email to respond to your feedback.</p>
              <div class="feedback-field-error" id="feedbackEmailError" role="alert"></div>
            </div>

            <!-- Privacy Notice -->
            <div class="feedback-privacy-note">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feedback-privacy-icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Your feedback is sent to Suvidha so we can improve the product. Files you process with Suvidha are not included.</span>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="feedback-submit-btn" id="feedbackSubmitBtn">
              <span class="feedback-btn-text">Send Feedback →</span>
              <span class="feedback-btn-spinner" style="display:none;" aria-hidden="true">
                <svg class="feedback-spinner-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"/>
                </svg>
                <span>Sending...</span>
              </span>
            </button>
          </form>

          <!-- Success State View -->
          <div class="feedback-success-view" id="feedbackSuccessView" style="display: none;" role="status">
            <div class="feedback-success-icon">✓</div>
            <h3 class="feedback-success-title">Thanks for helping improve Suvidha! ❤️</h3>
            <p class="feedback-success-desc">You can help us make Suvidha better with every suggestion.</p>
            <button type="button" class="feedback-success-close-btn" id="feedbackSuccessCloseBtn">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  modalOverlayEl = document.getElementById('suvidhaFeedbackOverlay');

  injectStyles();
  attachEventListeners();

  return modalOverlayEl;
}

/**
 * Injects modal styles with rich aesthetic matching Suvidha theme.
 */
function injectStyles() {
  if (document.getElementById('suvidha-feedback-styles')) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'suvidha-feedback-styles';
  styleEl.textContent = `
    .feedback-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 10070;
      background: rgba(4, 6, 12, 0.72);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .feedback-modal-overlay.is-open {
      display: flex;
      opacity: 1;
    }
    .feedback-modal-dialog {
      background: var(--surface, #13141a);
      border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
      border-radius: 20px;
      width: min(520px, 100%);
      max-height: min(90vh, 760px);
      overflow-y: auto;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
      transform: translateY(12px) scale(0.98);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }
    .feedback-modal-overlay.is-open .feedback-modal-dialog {
      transform: translateY(0) scale(1);
    }
    .feedback-modal-header {
      padding: 24px 24px 16px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    }
    .feedback-modal-header-copy {
      flex: 1;
    }
    .feedback-modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--text, #f0f2f5);
      letter-spacing: -0.01em;
    }
    .feedback-modal-desc {
      margin: 6px 0 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--muted, #9499ad);
    }
    .feedback-modal-close {
      width: 36px;
      height: 36px;
      min-width: 36px;
      min-height: 36px;
      border-radius: 10px;
      border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
      background: var(--surface2, rgba(255, 255, 255, 0.05));
      color: var(--muted, #9499ad);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }
    .feedback-modal-close:hover,
    .feedback-modal-close:focus-visible {
      background: var(--border, rgba(255, 255, 255, 0.15));
      color: var(--text, #ffffff);
      outline: 2px solid var(--accent, #58a6ff);
      outline-offset: 1px;
    }
    .feedback-modal-body {
      padding: 20px 24px 24px;
    }
    .feedback-global-error {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 18px;
    }
    .feedback-field-group {
      margin-bottom: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .feedback-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .feedback-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text, #e2e5eb);
    }
    .feedback-req-star {
      color: #f87171;
      margin-left: 2px;
    }
    .feedback-char-count {
      font-size: 11px;
      color: var(--muted, #8b92a5);
    }
    .feedback-select,
    .feedback-input,
    .feedback-textarea {
      width: 100%;
      box-sizing: border-box;
      background: var(--surface2, rgba(255, 255, 255, 0.04));
      border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 14px;
      color: var(--text, #f0f2f5);
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      min-height: 44px;
    }
    .feedback-select {
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239499ad' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 14px center;
      background-size: 14px;
      padding-right: 36px;
    }
    .feedback-select option {
      background: #181920;
      color: #f0f2f5;
    }
    .feedback-textarea {
      resize: vertical;
      min-height: 96px;
      line-height: 1.5;
    }
    .feedback-select:focus,
    .feedback-input:focus,
    .feedback-textarea:focus {
      border-color: var(--accent, #58a6ff);
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.18);
    }
    .feedback-select.is-invalid,
    .feedback-input.is-invalid,
    .feedback-textarea.is-invalid {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
    }
    .feedback-field-error {
      font-size: 12px;
      color: #f87171;
      min-height: 0;
      display: none;
    }
    .feedback-field-error.has-error {
      display: block;
      margin-top: 2px;
    }
    .feedback-helper-text {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--muted, #8b92a5);
    }
    .feedback-email-privacy {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--accent, #58a6ff);
    }
    .feedback-privacy-note {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--surface2, rgba(255, 255, 255, 0.03));
      border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
      margin-bottom: 20px;
      font-size: 12px;
      line-height: 1.45;
      color: var(--muted, #9499ad);
    }
    .feedback-privacy-icon {
      color: var(--accent, #58a6ff);
      flex-shrink: 0;
      margin-top: 1px;
    }
    .feedback-submit-btn {
      width: 100%;
      min-height: 46px;
      padding: 12px 20px;
      border-radius: 12px;
      border: none;
      background: var(--accent, #58a6ff);
      color: #0b0d14;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
    }
    .feedback-submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(88, 166, 255, 0.3);
    }
    .feedback-submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }
    .feedback-spinner-svg {
      animation: feedbackSpin 0.8s linear infinite;
    }
    @keyframes feedbackSpin {
      100% { transform: rotate(360deg); }
    }
    .feedback-success-view {
      padding: 24px 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .feedback-success-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(74, 222, 128, 0.15);
      border: 1px solid rgba(74, 222, 128, 0.35);
      color: #4ade80;
      font-size: 22px;
      display: grid;
      place-items: center;
      font-weight: bold;
    }
    .feedback-success-title {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--text, #f0f2f5);
    }
    .feedback-success-desc {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--muted, #9499ad);
      max-width: 360px;
    }
    .feedback-success-close-btn {
      margin-top: 8px;
      padding: 10px 24px;
      min-height: 44px;
      border-radius: 10px;
      border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
      background: var(--surface2, rgba(255, 255, 255, 0.08));
      color: var(--text, #f0f2f5);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .feedback-success-close-btn:hover {
      background: var(--border, rgba(255, 255, 255, 0.2));
    }
    .footer-feedback-link {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--muted, #9499ad);
      transition: color 0.15s ease;
    }
    .footer-feedback-link:hover {
      color: var(--accent, #58a6ff);
    }
    @media (max-width: 520px) {
      .feedback-modal-overlay {
        padding: 0;
        align-items: flex-end;
      }
      .feedback-modal-dialog {
        border-radius: 20px 20px 0 0;
        max-height: 85vh;
        width: 100%;
      }
    }
  `;

  document.head.appendChild(styleEl);
}

/**
 * Binds events to modal elements (validation, submit, close, traps).
 */
function attachEventListeners() {
  if (!modalOverlayEl) return;

  const closeBtn = modalOverlayEl.querySelector('#feedbackModalClose');
  const form = modalOverlayEl.querySelector('#suvidhaFeedbackForm');
  const messageInput = modalOverlayEl.querySelector('#feedbackMessageInput');
  const nameInput = modalOverlayEl.querySelector('#feedbackNameInput');
  const emailInput = modalOverlayEl.querySelector('#feedbackEmailInput');
  const typeInput = modalOverlayEl.querySelector('#feedbackTypeInput');
  const charCount = modalOverlayEl.querySelector('#feedbackCharCount');
  const emailPrivacy = modalOverlayEl.querySelector('#feedbackEmailPrivacy');
  const successCloseBtn = modalOverlayEl.querySelector('#feedbackSuccessCloseBtn');

  // Close handlers
  if (closeBtn) closeBtn.addEventListener('click', closeFeedbackModal);
  if (successCloseBtn) successCloseBtn.addEventListener('click', closeFeedbackModal);
  
  modalOverlayEl.addEventListener('click', (e) => {
    if (e.target === modalOverlayEl) closeFeedbackModal();
  });

  // Dynamic email privacy hint & char count updates
  if (emailInput && emailPrivacy) {
    emailInput.addEventListener('input', () => {
      const hasEmail = emailInput.value.trim().length > 0;
      emailPrivacy.style.display = hasEmail ? 'block' : 'none';
      clearFieldError('feedbackEmailInput', 'feedbackEmailError');
    });
  }

  if (messageInput && charCount) {
    messageInput.addEventListener('input', () => {
      const len = messageInput.value.length;
      charCount.textContent = `${len}/2000`;
      clearFieldError('feedbackMessageInput', 'feedbackMessageError');
    });
  }

  if (typeInput) {
    typeInput.addEventListener('change', () => {
      clearFieldError('feedbackTypeInput', 'feedbackTypeError');
    });
  }

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      clearFieldError('feedbackNameInput', 'feedbackNameError');
    });
  }

  // Form Submission
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Keydown listener for Escape and Focus trap
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * Clears field error indicators.
 */
function clearFieldError(inputId, errorId) {
  if (!modalOverlayEl) return;
  const input = modalOverlayEl.querySelector(`#${inputId}`);
  const err = modalOverlayEl.querySelector(`#${errorId}`);
  if (input) input.classList.remove('is-invalid');
  if (err) {
    err.textContent = '';
    err.classList.remove('has-error');
  }
}

/**
 * Displays error on a specific field.
 */
function showFieldError(inputId, errorId, message) {
  if (!modalOverlayEl) return;
  const input = modalOverlayEl.querySelector(`#${inputId}`);
  const err = modalOverlayEl.querySelector(`#${errorId}`);
  if (input) input.classList.add('is-invalid');
  if (err) {
    err.textContent = message;
    err.classList.add('has-error');
  }
}

/**
 * Handles Form Submission.
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  if (isSubmitting || !modalOverlayEl) return;

  const form = modalOverlayEl.querySelector('#suvidhaFeedbackForm');
  const typeInput = modalOverlayEl.querySelector('#feedbackTypeInput');
  const messageInput = modalOverlayEl.querySelector('#feedbackMessageInput');
  const nameInput = modalOverlayEl.querySelector('#feedbackNameInput');
  const emailInput = modalOverlayEl.querySelector('#feedbackEmailInput');
  const globalError = modalOverlayEl.querySelector('#feedbackGlobalError');
  const submitBtn = modalOverlayEl.querySelector('#feedbackSubmitBtn');
  const btnText = submitBtn.querySelector('.feedback-btn-text');
  const btnSpinner = submitBtn.querySelector('.feedback-btn-spinner');
  const successView = modalOverlayEl.querySelector('#feedbackSuccessView');

  // Hide global error
  if (globalError) globalError.style.display = 'none';

  // Clear existing errors
  clearFieldError('feedbackTypeInput', 'feedbackTypeError');
  clearFieldError('feedbackMessageInput', 'feedbackMessageError');
  clearFieldError('feedbackNameInput', 'feedbackNameError');
  clearFieldError('feedbackEmailInput', 'feedbackEmailError');

  const type = typeInput.value;
  const message = messageInput.value;
  const name = nameInput.value;
  const email = emailInput.value;

  // Validate on client
  const validation = validateFeedbackForm({ type, message, name, email });
  if (!validation.isValid) {
    if (validation.errors.type) showFieldError('feedbackTypeInput', 'feedbackTypeError', validation.errors.type);
    if (validation.errors.message) showFieldError('feedbackMessageInput', 'feedbackMessageError', validation.errors.message);
    if (validation.errors.name) showFieldError('feedbackNameInput', 'feedbackNameError', validation.errors.name);
    if (validation.errors.email) showFieldError('feedbackEmailInput', 'feedbackEmailError', validation.errors.email);
    return;
  }

  // Set submitting state
  isSubmitting = true;
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-flex';

  const toolSlug = typeof window !== 'undefined' && window.location.pathname.includes('/') 
    ? window.location.pathname.split('/').pop().replace('.html', '') 
    : '';

  const payload = {
    type: type.trim(),
    message: message.trim(),
    name: name.trim() ? name.trim() : undefined,
    email: email.trim() ? email.trim() : undefined,
    page: getCleanPageContext()
  };

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Success State
      analytics.feedbackSubmitted(type.trim(), toolSlug);
      form.style.display = 'none';
      successView.style.display = 'flex';
      
      // Reset form values for next time
      form.reset();
      const charCount = modalOverlayEl.querySelector('#feedbackCharCount');
      if (charCount) charCount.textContent = '0/2000';
      const emailPrivacy = modalOverlayEl.querySelector('#feedbackEmailPrivacy');
      if (emailPrivacy) emailPrivacy.style.display = 'none';
    } else {
      // Error State - Preserve values
      analytics.feedbackFailed(type.trim(), toolSlug);
      if (globalError) {
        globalError.textContent = result.error || "Couldn't send your feedback right now. Please try again.";
        globalError.style.display = 'block';
      }
    }
  } catch (err) {
    analytics.feedbackFailed(type.trim(), toolSlug);
    if (globalError) {
      globalError.textContent = "Couldn't send your feedback right now. Please try again.";
      globalError.style.display = 'block';
    }
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
}

/**
 * Handles Escape key and Focus Trap within modal.
 */
function handleKeyDown(e) {
  if (!modalOverlayEl || !modalOverlayEl.classList.contains('is-open')) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeFeedbackModal();
    return;
  }

  // Focus trap
  if (e.key === 'Tab') {
    const focusableEls = modalOverlayEl.querySelectorAll(
      'button:not([disabled]):not([style*="display: none"]), input:not([disabled]):not([style*="display: none"]), select:not([disabled]):not([style*="display: none"]), textarea:not([disabled]):not([style*="display: none"]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusableEls.length === 0) return;

    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        lastEl.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastEl) {
        firstEl.focus();
        e.preventDefault();
      }
    }
  }
}

/**
 * Opens feedback modal.
 */
export function openFeedbackModal(triggerElement = null) {
  analytics.feedbackOpened();

  try {
    previousActiveElement = triggerElement || document.activeElement;
  } catch {
    previousActiveElement = null;
  }

  if (!modalOverlayEl) {
    createModalDOM();
  }

  // Reset views if previously in success state
  const form = modalOverlayEl.querySelector('#suvidhaFeedbackForm');
  const successView = modalOverlayEl.querySelector('#feedbackSuccessView');
  const globalError = modalOverlayEl.querySelector('#feedbackGlobalError');

  if (form) form.style.display = 'block';
  if (successView) successView.style.display = 'none';
  if (globalError) globalError.style.display = 'none';

  modalOverlayEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  try {
    window.dispatchEvent(new CustomEvent('suvidha:feedback-modal-open'));
  } catch {}

  requestAnimationFrame(() => {
    const focusTarget = modalOverlayEl.querySelector('#feedbackTypeInput');
    if (focusTarget) focusTarget.focus();
  });
}

/**
 * Closes feedback modal and restores focus.
 */
export function closeFeedbackModal() {
  if (!modalOverlayEl) return;

  modalOverlayEl.classList.remove('is-open');
  document.body.style.overflow = '';

  try {
    window.dispatchEvent(new CustomEvent('suvidha:feedback-modal-close'));
  } catch {}

  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    try {
      previousActiveElement.focus();
    } catch {}
    previousActiveElement = null;
  }
}

/**
 * Initializes feedback modal entry points across page.
 */
export function initFeedbackSystem() {
  createModalDOM();

  // Attach click to any link/button with data-suvidha-feedback or #footerFeedbackBtn
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-suvidha-feedback], #footerFeedbackBtn, .feedback-footer-link');
    if (target) {
      e.preventDefault();
      openFeedbackModal(target);
    }
  });
}
