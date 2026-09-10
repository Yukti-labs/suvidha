// Tool Chaining Module: Contextual Next Actions after Task Completion
// Standardized "Continue with Suvidha" UX loop.
// All routes use canonical root-relative paths from routes.js.

import { normalizeToolSlug, getToolRoute } from './routes.js';
import { getToolIcon } from './config.js';

export const TOOL_CHAINS = Object.freeze({
  'pdf-compressor': [
    { label: 'Merge PDF', targetSlug: 'pdf-merger', icon: 'merger' },
    { label: 'Compress another PDF', action: 'reset', icon: 'compressPdf' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'pdf-merger': [
    { label: 'Compress resulting PDF', targetSlug: 'pdf-compressor', icon: 'compressPdf' },
    { label: 'Merge another PDF', action: 'reset', icon: 'merger' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'pdf-unlock': [
    { label: 'Compress PDF', targetSlug: 'pdf-compressor', icon: 'compressPdf' },
    { label: 'Merge PDF', targetSlug: 'pdf-merger', icon: 'merger' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'image-compressor': [
    { label: 'Convert images to PDF', targetSlug: 'image-to-pdf', icon: 'imageToPdf' },
    { label: 'Compress another image', action: 'reset', icon: 'compressImage' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'image-to-pdf': [
    { label: 'Compress resulting PDF', targetSlug: 'pdf-compressor', icon: 'compressPdf' },
    { label: 'Create another PDF', action: 'reset', icon: 'imageToPdf' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'json-formatter': [
    { label: 'Validate JSON', targetSlug: 'json-validator', icon: 'jsonValidator' },
    { label: 'Convert JSON to CSV', targetSlug: 'json-to-csv', icon: 'jsonToCsv' },
    { label: 'Format another JSON', action: 'reset', icon: 'jsonFormatter' }
  ],
  'json-validator': [
    { label: 'Format JSON', targetSlug: 'json-formatter', icon: 'jsonFormatter' },
    { label: 'Validate another JSON', action: 'reset', icon: 'jsonValidator' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'json-to-csv': [
    { label: 'Format JSON', targetSlug: 'json-formatter', icon: 'jsonFormatter' },
    { label: 'Convert another JSON', action: 'reset', icon: 'jsonToCsv' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'resume-builder': [
    { label: 'Compress resulting PDF', targetSlug: 'pdf-compressor', icon: 'compressPdf' },
    { label: 'Build another resume', action: 'reset', icon: 'resume' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'emi-calculator': [
    { label: 'Calculate another EMI', action: 'reset', icon: 'emi' },
    { label: 'Plan SIP investment', targetSlug: 'sip-calculator', icon: 'sip' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'gst-calculator': [
    { label: 'Calculate another GST', action: 'reset', icon: 'gst' },
    { label: 'Calculate Loan EMI', targetSlug: 'emi-calculator', icon: 'emi' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'sip-calculator': [
    { label: 'Calculate another SIP', action: 'reset', icon: 'sip' },
    { label: 'Calculate Loan EMI', targetSlug: 'emi-calculator', icon: 'emi' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'word-counter': [
    { label: 'Count another text', action: 'reset', icon: 'words' },
    { label: 'Analyze Keywords', targetSlug: 'keyword-analyzer', icon: 'keyword' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'qr-generator': [
    { label: 'Create another QR', action: 'reset', icon: 'qr' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'password-generator': [
    { label: 'Generate another password', action: 'reset', icon: 'password' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'meta-tag-generator': [
    { label: 'Generate another meta tag', action: 'reset', icon: 'metaTag' },
    { label: 'Generate Sitemap', targetSlug: 'sitemap-generator', icon: 'sitemap' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'sitemap-generator': [
    { label: 'Generate another sitemap', action: 'reset', icon: 'sitemap' },
    { label: 'Generate Meta Tags', targetSlug: 'meta-tag-generator', icon: 'metaTag' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ],
  'keyword-analyzer': [
    { label: 'Analyze another text', action: 'reset', icon: 'keyword' },
    { label: 'Count Words', targetSlug: 'word-counter', icon: 'words' },
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ]
});

/**
 * Returns contextual next actions for a tool.
 * @param {string} identifier - Tool name or slug
 * @returns {Array<{label: string, url?: string, action?: string, icon?: string}>}
 */
export function getToolChain(identifier) {
  const slug = normalizeToolSlug(identifier);
  const actions = TOOL_CHAINS[slug] || [
    { label: 'Tell Suvidha', action: 'tell', icon: 'sparkle' }
  ];

  return actions.map(act => {
    if (act.targetSlug) {
      return {
        ...act,
        url: getToolRoute(act.targetSlug),
        action: 'navigate'
      };
    }
    return act;
  });
}

/**
 * Renders the standardized "Continue with Suvidha" task chaining box into a container.
 * @param {HTMLElement} container - DOM element to render into
 * @param {Object} options
 * @param {string} options.toolSlug - Slug of current tool
 * @param {Function} [options.onReset] - Callback when "Start over / another" is clicked
 * @param {Function} [options.onTellSuvidha] - Callback when "Tell Suvidha" is clicked
 */
export function renderContinueWithSuvidha(container, { toolSlug, onReset, onTellSuvidha } = {}) {
  if (!container) return;

  const actions = getToolChain(toolSlug);

  container.innerHTML = `
    <div class="suvidha-task-chain">
      <div class="task-chain-header">
        <span class="task-chain-badge">✓ Task completed</span>
        <div class="task-chain-title">Continue with Suvidha</div>
      </div>
      <div class="task-chain-actions">
        ${actions.map((act, i) => {
          if (act.action === 'reset') {
            return `
              <button type="button" class="task-chain-btn" data-chain-action="reset">
                ${act.icon ? getToolIcon(act.icon) : ''}
                <span>${act.label}</span>
                <span class="task-chain-arrow">↺</span>
              </button>
            `;
          }
          if (act.action === 'tell') {
            return `
              <button type="button" class="task-chain-btn is-tell" data-chain-action="tell">
                <span style="color:var(--accent)">✦</span>
                <span>${act.label}</span>
                <span class="task-chain-arrow">→</span>
              </button>
            `;
          }
          return `
            <a href="${act.url}" class="task-chain-btn" data-chain-action="navigate">
              ${act.icon ? getToolIcon(act.icon) : ''}
              <span>${act.label}</span>
              <span class="task-chain-arrow">→</span>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Attach event handlers
  container.querySelectorAll('[data-chain-action="reset"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof onReset === 'function') onReset();
    });
  });

  container.querySelectorAll('[data-chain-action="tell"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof onTellSuvidha === 'function') {
        onTellSuvidha();
      } else if (window.openTellSuvidhaModal) {
        window.openTellSuvidhaModal({ toolSlug });
      }
    });
  });

  container.style.display = 'block';
}
