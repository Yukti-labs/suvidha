// Feedback system module
export function initFeedbackSystem() {
  const feedbackModalHtml = `
    <div class="feedback-modal-overlay" id="feedbackModalOverlay">
      <div class="feedback-modal" id="feedbackModal">
        <div class="feedback-modal-header">
          <h3>Share Your Feedback</h3>
          <button class="feedback-modal-close" id="feedbackModalClose" aria-label="Close feedback modal">✕</button>
        </div>
        <div class="feedback-modal-body">
          <p class="feedback-modal-sub">Help us improve Suvidha Tools with your suggestions.</p>
          <form id="feedbackForm">
            <div class="feedback-field">
              <label for="feedbackName">Your Name</label>
              <input type="text" id="feedbackName" name="name" placeholder="Enter your name" required>
            </div>
            <div class="feedback-field">
              <label for="feedbackEmail">Your Email</label>
              <input type="email" id="feedbackEmail" name="email" placeholder="Enter your email" required>
            </div>
            <div class="feedback-field">
              <label for="feedbackMessage">Your Feedback</label>
              <textarea id="feedbackMessage" name="message" rows="4" placeholder="Tell us what you think..." required></textarea>
            </div>
            <button type="submit" class="feedback-submit-btn">
              <span>📧</span> Send Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', feedbackModalHtml);

  const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackModalClose = document.getElementById('feedbackModalClose');
  const feedbackForm = document.getElementById('feedbackForm');

  // Add feedback button to nav actions
  const feedbackBtn = document.createElement('button');
  feedbackBtn.className = 'site-nav-chip feedback-btn';
  feedbackBtn.innerHTML = '<span>💬</span> Feedback';
  feedbackBtn.setAttribute('aria-label', 'Open feedback form');
  const navActions = document.querySelector('.site-nav-actions');
  if (navActions) {
    navActions.insertBefore(feedbackBtn, navActions.firstChild);
  }

  // Add footer feedback link functionality
  const footerFeedbackBtn = document.getElementById('footerFeedbackBtn');
  if (footerFeedbackBtn) {
    footerFeedbackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      feedbackBtn.click();
    });
  }

  // Open feedback modal
  feedbackBtn.addEventListener('click', () => {
    feedbackModalOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });

  // Close feedback modal
  const closeFeedbackModal = () => {
    feedbackModalOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
    feedbackBtn.focus();
  };

  feedbackModalClose.addEventListener('click', closeFeedbackModal);
  feedbackModalOverlay.addEventListener('click', (e) => {
    if (e.target === feedbackModalOverlay) closeFeedbackModal();
  });

  // Keyboard accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && feedbackModalOverlay.classList.contains('is-open')) {
      closeFeedbackModal();
    }
  });

  // Handle form submission
  feedbackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = feedbackForm.querySelector('.feedback-submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> Sending...';
    
    const name = document.getElementById('feedbackName').value;
    const email = document.getElementById('feedbackEmail').value;
    const message = document.getElementById('feedbackMessage').value;

    const subject = encodeURIComponent('Suvidha feedback');
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nFeedback:\n${message}`
    );

    // Small delay to show loading state
    setTimeout(() => {
      window.location.href = `mailto:sujitdjoshi25@gmail.com?subject=${subject}&body=${body}`;
      
      closeFeedbackModal();
      feedbackForm.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'feedback-success-toast';
      successMsg.textContent = '✓ Thank you for your feedback!';
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.classList.add('visible');
        setTimeout(() => {
          successMsg.classList.remove('visible');
          setTimeout(() => successMsg.remove(), 300);
        }, 3000);
      }, 100);
    }, 500);
  });

  // Add feedback modal styles
  const feedbackStyles = document.createElement('style');
  feedbackStyles.textContent = `
    .feedback-btn {
      cursor: pointer !important;
      background: color-mix(in srgb, var(--accent, #58a6ff) 15%, transparent) !important;
      border-color: color-mix(in srgb, var(--accent, #58a6ff) 30%, transparent) !important;
      animation: pulse-glow 2s ease-in-out infinite;
    }
    .feedback-btn:hover {
      background: color-mix(in srgb, var(--accent, #58a6ff) 25%, transparent) !important;
      transform: translateY(-2px);
      animation: none;
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(88,166,255,0); }
      50% { box-shadow: 0 0 0 8px rgba(88,166,255,0.15); }
    }
    .feedback-modal-overlay {
      position: fixed;
      inset: 0;
      background: var(--overlay-bg);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    .feedback-modal-overlay.is-open {
      opacity: 1;
      visibility: visible;
    }
    .feedback-modal {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
      max-width: 480px;
      width: calc(100vw - 32px);
      max-height: calc(100vh - 64px);
      overflow-y: auto;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s ease;
      box-shadow: 0 24px 60px rgba(0,0,0,0.3);
    }
    .feedback-modal-overlay.is-open .feedback-modal {
      transform: translateY(0) scale(1);
    }
    .feedback-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .feedback-modal-header h3 {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin: 0;
    }
    .feedback-modal-close {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 10px;
      background: var(--surface2);
      color: var(--muted);
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .feedback-modal-close:hover {
      background: var(--border);
      color: var(--text);
    }
    .feedback-modal-sub {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .feedback-field {
      margin-bottom: 18px;
    }
    .feedback-field label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .feedback-field input,
    .feedback-field textarea {
      width: 100%;
      padding: 12px 16px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }
    .feedback-field input:focus,
    .feedback-field textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(88,166,255,0.15);
    }
    .feedback-field textarea {
      resize: vertical;
      min-height: 100px;
    }
    .feedback-submit-btn {
      width: 100%;
      padding: 14px;
      background: var(--accent);
      color: #0e0e10;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
      margin-top: 8px;
    }
    .feedback-submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(88,166,255,0.3);
    }
    .feedback-success-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--success, #4ade80);
      color: #0e0e10;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 12px 32px rgba(0,0,0,0.2);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 10001;
    }
    .feedback-success-toast.visible {
      transform: translateY(0);
      opacity: 1;
    }
    @media (max-width: 520px) {
      .feedback-modal {
        padding: 20px;
        border-radius: 16px;
      }
      .feedback-success-toast {
        left: 16px;
        right: 16px;
        bottom: 16px;
      }
    }
    .feedback-footer-link {
      background: color-mix(in srgb, var(--accent, #58a6ff) 10%, transparent) !important;
      border-color: color-mix(in srgb, var(--accent, #58a6ff) 25%, transparent) !important;
    }
    .feedback-footer-link:hover {
      background: color-mix(in srgb, var(--accent, #58a6ff) 20%, transparent) !important;
    }
  `;
  document.head.appendChild(feedbackStyles);
}
