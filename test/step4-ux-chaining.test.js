// Step 4 Verification: UX Polish, Tool Consistency & Workflow Quality Test Suite
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getToolChain,
  setChainPayload,
  consumeChainPayload,
  setChainTextPayload,
  consumeChainTextPayload
} from '../assets/js/modules/tool-chaining.js';
import { TOOL_ROUTES, getToolRoute, normalizeToolSlug } from '../assets/js/modules/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== Running Step 4: UX Polish, Chaining & Workflow Quality Tests ===\n');

// ----------------------------------------------------
// Test 1: Real Local Tool Chaining Payload Lifecycle
// ----------------------------------------------------
console.log('--- Test 1: Local Tool Chaining Payload (Single-use & In-browser) ---');

// 1a: Binary File/Blob Payload
const testBlob = {
  file: { name: 'test-merged.pdf', size: 2048, type: 'application/pdf' },
  name: 'test-merged.pdf',
  mime: 'application/pdf'
};

await setChainPayload(testBlob);
const consumed = await consumeChainPayload();
assert.ok(consumed, 'Payload should be retrievable on first consume');
assert.equal(consumed.name, 'test-merged.pdf', 'Payload name should match');
assert.equal(consumed.mime, 'application/pdf', 'Payload MIME should match');

// Verify single-use destruction
const consumedAgain = await consumeChainPayload();
assert.equal(consumedAgain, null, 'Payload MUST be deleted immediately after first consumption (single-use guarantee)');
console.log('✓ PASS: Binary chain payload stored, consumed, and immediately deleted (single-use).');

// 1b: Text Payload (JSON/data)
const testText = '{"status":"ok","items":[1,2,3]}';
setChainTextPayload(testText);
const consumedText = consumeChainTextPayload();
assert.equal(consumedText, testText, 'Text payload should match stored text');

const consumedTextAgain = consumeChainTextPayload();
assert.equal(consumedTextAgain, null, 'Text payload MUST be deleted immediately after first consumption');
console.log('✓ PASS: Text chain payload stored, consumed, and immediately deleted (single-use).');

// ----------------------------------------------------
// Test 2: Standard Chaining Across All 18 Production Tools
// ----------------------------------------------------
console.log('\n--- Test 2: 18-Tool Standardized Success & Chaining UI Verification ---');

const activeTools = Object.keys(TOOL_ROUTES);
assert.equal(activeTools.length, 18, 'Expected exactly 18 active production tools');

for (const slug of activeTools) {
  const relPath = TOOL_ROUTES[slug].replace(/^\//, '');
  const absPath = path.join(rootDir, relPath);
  assert.ok(fs.existsSync(absPath), `Tool page file must exist: ${relPath}`);

  const html = fs.readFileSync(absPath, 'utf-8');

  // Verify toolChainWrap container is present
  assert.ok(
    html.includes('id="toolChainWrap"'),
    `Tool ${slug} (${relPath}) must contain <div id="toolChainWrap"> for standardized chaining`
  );

  // Verify window.suvidhaChaining is called
  assert.ok(
    html.includes('suvidhaChaining'),
    `Tool ${slug} (${relPath}) must invoke window.suvidhaChaining on completion`
  );

  console.log(`✓ PASS: Tool "${slug}" has toolChainWrap and invokes suvidhaChaining`);
}

// ----------------------------------------------------
// Test 3: Zero Forbidden Claims & Compliant Privacy Copy
// ----------------------------------------------------
console.log('\n--- Test 3: Privacy Copy Compliance Across Production Tools ---');

const forbiddenPhrases = [
  '100% private',
  'completely anonymous',
  'nothing leaves your device',
  'zero tracking',
  'fully offline'
];

for (const slug of activeTools) {
  const relPath = TOOL_ROUTES[slug].replace(/^\//, '');
  const absPath = path.join(rootDir, relPath);
  const html = fs.readFileSync(absPath, 'utf-8').toLowerCase();

  for (const phrase of forbiddenPhrases) {
    assert.ok(
      !html.includes(phrase),
      `Tool ${slug} contains forbidden marketing claim: "${phrase}"`
    );
  }
}

// Check tell-suvidha-modal.js for forbidden claims
const modalCode = fs.readFileSync(path.join(rootDir, 'assets/js/modules/tell-suvidha-modal.js'), 'utf-8').toLowerCase();
for (const phrase of forbiddenPhrases) {
  assert.ok(
    !modalCode.includes(phrase),
    `tell-suvidha-modal.js contains forbidden marketing claim: "${phrase}"`
  );
}
assert.ok(
  modalCode.includes('processed directly in your browser'),
  'tell-suvidha-modal.js must use approved "Processed directly in your browser" phrasing'
);
assert.ok(
  modalCode.includes("aren't uploaded to suvidha's servers"),
  'tell-suvidha-modal.js must use approved "Files aren\'t uploaded to Suvidha\'s servers" phrasing'
);

console.log('✓ PASS: All 18 tools and Tell Suvidha modal adhere to strict privacy phrasing guidelines.');

// ----------------------------------------------------
// Test 4: Tell Suvidha Modal Accessibility & Focus Management
// ----------------------------------------------------
console.log('\n--- Test 4: Tell Suvidha Modal Accessibility & Dialog Semantics ---');

const rawModalSource = fs.readFileSync(path.join(rootDir, 'assets/js/modules/tell-suvidha-modal.js'), 'utf-8');
assert.ok(rawModalSource.includes('role="dialog"'), 'Modal must have role="dialog"');
assert.ok(rawModalSource.includes('aria-modal="true"'), 'Modal must have aria-modal="true"');
assert.ok(rawModalSource.includes('aria-labelledby="floatingTellEyebrow"'), 'Modal must reference eyebrow for labeling');
assert.ok(rawModalSource.includes('aria-live="polite"'), 'Modal recommendation card must have aria-live="polite"');
assert.ok(rawModalSource.includes('previousActiveElement'), 'Modal must track previousActiveElement for focus restoration');
assert.ok(rawModalSource.includes("e.key === 'Escape'"), 'Modal must listen for Escape key to close');

console.log('✓ PASS: Tell Suvidha modal has accessibility semantics, ARIA live region, and focus restoration.');

// ----------------------------------------------------
// Test 5: Mobile Clearance & Responsive Padding
// ----------------------------------------------------
console.log('\n--- Test 5: Mobile Clearance & Responsive Styles ---');

const toolPageCss = fs.readFileSync(path.join(rootDir, 'assets/css/tool-page.css'), 'utf-8');
assert.ok(toolPageCss.includes('padding: 16px 14px 84px !important;'), 'Tool page CSS must have 84px bottom padding on mobile for floating button clearance');
assert.ok(toolPageCss.includes('@media (prefers-reduced-motion: reduce)'), 'Tool page CSS must respect prefers-reduced-motion');

console.log('✓ PASS: Mobile clearance and prefers-reduced-motion verified.');

console.log('\n========================================');
console.log('All Step 4 UX Polish & Chaining tests PASSED successfully!');
