// Centralized File & Content Sharing Module for Suvidha Tools
// PRIVACY-FIRST GUARANTEE:
// 1. NEVER shares browser-local blob: URLs over Web Share API.
// 2. Prefers native file sharing (navigator.share({ files: [file] })).
// 3. Appends subtle, official Suvidha attribution text without server uploads.
// 4. Provides non-intrusive download fallback if file sharing is unsupported.

export const ATTRIBUTIONS = Object.freeze({
  'image-to-pdf': 'Converted to PDF with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in',
  'pdf-compressor': 'Compressed with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in',
  'pdf-merger': 'Merged with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in',
  'pdf-unlock': 'Processed with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in',
  'image-compressor': 'Compressed with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in',
  'resume-builder': 'Created with Suvidha Tools.\nhttps://www.suvidhatools.in',
  'qr-generator': 'Created with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in',
  'default': 'Made with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in'
});

export const FALLBACK_MESSAGE = "Your browser can't share files directly. Download the file and attach it in WhatsApp or another app.";

/**
 * Returns concise attribution text for a tool.
 * @param {string} toolSlugOrAction 
 * @returns {string}
 */
export function getAttributionText(toolSlugOrAction = '') {
  if (!toolSlugOrAction) return ATTRIBUTIONS['default'];
  const key = String(toolSlugOrAction).toLowerCase().trim();
  if (ATTRIBUTIONS[key]) return ATTRIBUTIONS[key];
  if (key.includes('pdf') && (key.includes('convert') || key.includes('image-to-pdf'))) return ATTRIBUTIONS['image-to-pdf'];
  if (key.includes('compress') && key.includes('pdf')) return ATTRIBUTIONS['pdf-compressor'];
  if (key.includes('merge')) return ATTRIBUTIONS['pdf-merger'];
  if (key.includes('unlock') || key.includes('decrypt')) return ATTRIBUTIONS['pdf-unlock'];
  if (key.includes('compress') && key.includes('image')) return ATTRIBUTIONS['image-compressor'];
  if (key.includes('resume')) return ATTRIBUTIONS['resume-builder'];
  if (key.includes('qr')) return ATTRIBUTIONS['qr-generator'];
  return ATTRIBUTIONS['default'];
}

/**
 * Checks if the current browser environment supports sharing files directly.
 * @param {File|Blob} [sampleFile] 
 * @returns {boolean}
 */
export function canShareFiles(sampleFile) {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false;
  }
  try {
    let testFile = sampleFile;
    if (!(testFile instanceof (typeof File !== 'undefined' ? File : Object))) {
      const BlobConstructor = typeof Blob !== 'undefined' ? Blob : class {};
      testFile = new File([new BlobConstructor([])], 'test.pdf', { type: 'application/pdf' });
    }
    return Boolean(navigator.canShare({ files: [testFile] }));
  } catch (e) {
    return false;
  }
}

/**
 * Displays a subtle temporary toast notice for fallback guidance.
 * @param {string} message 
 */
export function showShareToast(message) {
  if (typeof document === 'undefined') return;
  let toast = document.getElementById('suvidhaShareToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'suvidhaShareToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
      position: fixed;
      bottom: calc(84px + env(safe-area-inset-bottom, 0px));
      left: 50%;
      transform: translateX(-50%) translateY(16px);
      background: var(--surface, #18181b);
      color: var(--text, #f4f4f5);
      border: 1px solid var(--border, #27272a);
      box-shadow: 0 10px 30px rgba(0,0,0,0.38);
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.4;
      max-width: min(440px, calc(100vw - 32px));
      z-index: 10050;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      text-align: center;
      font-family: inherit;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.pointerEvents = 'auto';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    toast.style.transform = 'translateX(-50%) translateY(16px)';
  }, 4200);
}

/**
 * Handles unsupported file sharing or fallback scenarios.
 * @param {Function} [onFallback] 
 * @param {string} [toolSlug] 
 */
function handleFallback(onFallback, toolSlug = '') {
  if (typeof window !== 'undefined' && window.suvidhaAnalytics) {
    window.suvidhaAnalytics.shareFallbackDownload?.(toolSlug) || window.suvidhaAnalytics.trackEvent?.('share_fallback_download', { tool: toolSlug });
  }
  if (typeof onFallback === 'function') {
    onFallback(FALLBACK_MESSAGE);
    return;
  }
  showShareToast(FALLBACK_MESSAGE);
}

/**
 * Shares an actual File or Blob with attribution.
 * NEVER shares a blob: URL.
 * 
 * @param {File|Blob} fileOrBlob 
 * @param {Object} options 
 * @param {string} [options.filename] - Recommended file name
 * @param {string} [options.toolSlug] - Tool slug for attribution and analytics
 * @param {string} [options.action] - Action label (e.g. 'Converted to PDF')
 * @param {string} [options.title] - Share sheet title
 * @param {string} [options.mime] - MIME type fallback
 * @param {Function} [options.onFallback] - Optional custom fallback callback
 * @returns {Promise<{success: boolean, method?: string, cancelled?: boolean, fallback?: string, error?: string}>}
 */
export async function shareFile(fileOrBlob, options = {}) {
  const {
    filename = 'document.pdf',
    toolSlug = '',
    action = '',
    title = '',
    mime = '',
    onFallback
  } = options;

  if (typeof window !== 'undefined' && window.suvidhaAnalytics) {
    window.suvidhaAnalytics.shareClicked?.(toolSlug) || window.suvidhaAnalytics.trackEvent?.('share_clicked', { tool: toolSlug });
  }

  // 1. ABSOLUTE GUARD: Reject strings (prevent any blob: or http: URL passed as file)
  if (typeof fileOrBlob === 'string') {
    console.warn('[Suvidha Share] URLs cannot be shared as files. Blob URLs must never be shared.');
    handleFallback(onFallback, toolSlug);
    return { success: false, fallback: 'download', error: 'invalid_file_payload' };
  }

  // 2. Ensure a genuine File object with proper name and MIME
  let file;
  try {
    if (typeof File !== 'undefined' && fileOrBlob instanceof File) {
      file = fileOrBlob;
    } else if (typeof Blob !== 'undefined' && fileOrBlob instanceof Blob) {
      const detectedMime = fileOrBlob.type || mime || 'application/octet-stream';
      file = new File([fileOrBlob], filename, { type: detectedMime });
    } else {
      handleFallback(onFallback, toolSlug);
      return { success: false, fallback: 'download', error: 'invalid_file_instance' };
    }
  } catch (err) {
    handleFallback(onFallback, toolSlug);
    return { success: false, fallback: 'download', error: err.message };
  }

  // 3. Verify file sharing capability via navigator.canShare
  const supported = canShareFiles(file);
  if (!supported) {
    handleFallback(onFallback, toolSlug);
    return { success: false, fallback: 'download', reason: 'unsupported' };
  }

  // 4. Perform actual file sharing with attribution text
  const shareTitle = title || file.name;
  const shareText = getAttributionText(toolSlug || action);

  try {
    // CRITICAL: files array passed. NEVER pass url: blobUrl!
    await navigator.share({
      title: shareTitle,
      text: shareText,
      files: [file]
    });

    if (typeof window !== 'undefined' && window.suvidhaAnalytics) {
      window.suvidhaAnalytics.shareSuccess?.(toolSlug) || window.suvidhaAnalytics.trackEvent?.('share_success', { tool: toolSlug });
    }

    return { success: true, method: 'files' };
  } catch (err) {
    if (err && err.name === 'AbortError') {
      // User dismissed the native share sheet
      return { success: false, cancelled: true };
    }
    // Any other platform/sharing error falls back gracefully
    handleFallback(onFallback, toolSlug);
    return { success: false, fallback: 'download', error: err.message };
  }
}

/**
 * Text-only share helper for non-file content (e.g. sharing tool link).
 * NEVER includes user-generated file contents or blob: URLs.
 * 
 * @param {Object} options 
 * @param {string} options.title 
 * @param {string} options.text 
 * @param {string} [options.url] 
 * @param {string} [options.toolSlug] 
 * @returns {Promise<{success: boolean, method?: string, cancelled?: boolean, error?: string}>}
 */
export async function shareText(options = {}) {
  const { title = '', text = '', url = '', toolSlug = '' } = options;

  let safeUrl = url;
  if (typeof safeUrl === 'string' && safeUrl.startsWith('blob:')) {
    console.warn('[Suvidha Share] blob: URL rejected from shareText');
    safeUrl = '';
  }

  if (typeof window !== 'undefined' && window.suvidhaAnalytics && toolSlug) {
    window.suvidhaAnalytics.shareClicked?.(toolSlug) || window.suvidhaAnalytics.trackEvent?.('share_clicked', { tool: toolSlug });
  }

  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    if (safeUrl && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(safeUrl);
      return { success: true, method: 'clipboard' };
    }
    return { success: false, reason: 'unsupported' };
  }

  const payload = { title, text };
  if (safeUrl) payload.url = safeUrl;

  try {
    await navigator.share(payload);
    if (typeof window !== 'undefined' && window.suvidhaAnalytics && toolSlug) {
      window.suvidhaAnalytics.shareSuccess?.(toolSlug) || window.suvidhaAnalytics.trackEvent?.('share_success', { tool: toolSlug });
    }
    return { success: true, method: 'text' };
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { success: false, cancelled: true };
    }
    return { success: false, error: err.message };
  }
}
