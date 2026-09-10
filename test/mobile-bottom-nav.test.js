// Step 4.1 Verification: Mobile Bottom Navigation & Tell Suvidha Icon-First Test Suite
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOOL_ROUTES } from '../assets/js/modules/routes.js';
import { icons } from '../assets/js/modules/icons.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== Running Step 4.1: Mobile Bottom Navigation & Tell Suvidha Tests ===\n');

const sharedUiSource = fs.readFileSync(path.join(rootDir, 'assets/js/shared-ui-new.js'), 'utf-8');
const toolPageCss = fs.readFileSync(path.join(rootDir, 'assets/css/tool-page.css'), 'utf-8');
const modalSource = fs.readFileSync(path.join(rootDir, 'assets/js/modules/tell-suvidha-modal.js'), 'utf-8');

// ----------------------------------------------------
// Test 1: Bottom Navigation Exists & Semantic Markup
// ----------------------------------------------------
console.log('--- Test 1: Bottom Navigation Markup & Semantic Elements ---');
assert.ok(sharedUiSource.includes('<nav class="mobile-bottom-nav"'), 'Semantic <nav class="mobile-bottom-nav"> must exist in shared-ui-new.js');
assert.ok(sharedUiSource.includes('aria-label="Mobile Navigation"'), 'Bottom navigation must have aria-label="Mobile Navigation"');
console.log('✓ PASS: Semantic mobile bottom navigation exists with accessible label.');

// ----------------------------------------------------
// Test 2: Four Navigation Destinations / Actions Exist
// ----------------------------------------------------
console.log('\n--- Test 2: Four Navigation Destinations / Actions ---');
assert.ok(sharedUiSource.includes('data-nav-target="home"'), 'Home nav item must exist');
assert.ok(sharedUiSource.includes('data-nav-target="tools"'), 'Tools nav item must exist');
assert.ok(sharedUiSource.includes('data-nav-target="recent"'), 'Recent nav item must exist');
assert.ok(sharedUiSource.includes('data-nav-target="tell"'), 'Tell Suvidha nav item must exist');

assert.ok(sharedUiSource.includes('aria-label="Home"'), 'Home item must have aria-label="Home"');
assert.ok(sharedUiSource.includes('aria-label="Tools"'), 'Tools item must have aria-label="Tools"');
assert.ok(sharedUiSource.includes('aria-label="Recently Used Tools"'), 'Recent item must have aria-label');
assert.ok(sharedUiSource.includes('aria-label="Tell Suvidha"'), 'Tell Suvidha item must have aria-label="Tell Suvidha"');

console.log('✓ PASS: Four navigation destinations (Home, Tools, Recent, Tell Suvidha) exist with full ARIA semantics.');

// ----------------------------------------------------
// Test 3: Tell Suvidha Icon-First & Reuses Existing Modal
// ----------------------------------------------------
console.log('\n--- Test 3: Tell Suvidha Reuses Existing Modal (No Duplication) ---');
assert.ok(sharedUiSource.includes('openTellSuvidhaModal({ toolSlug })'), 'Mobile Tell item must call openTellSuvidhaModal() directly');
assert.ok(!sharedUiSource.includes('createSecondaryModal'), 'No secondary modal must be created');
assert.ok(sharedUiSource.includes('.mobile-nav-tell-icon'), 'Tell Suvidha item must have prominent icon container');
assert.ok(modalSource.includes('suvidha:tell-modal-open'), 'Tell modal must emit suvidha:tell-modal-open event');
assert.ok(modalSource.includes('suvidha:tell-modal-close'), 'Tell modal must emit suvidha:tell-modal-close event');
console.log('✓ PASS: Tell Suvidha reuses existing modal with icon-first emphasis and synchronized open/close events.');

// ----------------------------------------------------
// Test 4: Mobile Floating Button is Hidden
// ----------------------------------------------------
console.log('\n--- Test 4: Floating Tell Button Hidden on Mobile ---');
assert.ok(sharedUiSource.includes('.floating-tell-btn {\n        display: none !important;\n      }'), 'Floating button must be display: none !important on mobile widths');
console.log('✓ PASS: Floating Tell button is hidden on mobile to avoid UI overlap and CTA occlusion.');

// ----------------------------------------------------
// Test 5: Desktop Floating Button Remains Available & Bottom Nav Hidden on Desktop
// ----------------------------------------------------
console.log('\n--- Test 5: Desktop Floating Button Available & Bottom Nav Hidden on Desktop ---');
assert.ok(sharedUiSource.includes('.floating-tell-btn {\n      position: fixed;'), 'Floating Tell Suvidha button retains fixed desktop positioning');
assert.ok(sharedUiSource.includes('.mobile-bottom-nav {\n      display: none;\n    }'), 'Mobile bottom nav is hidden on desktop by default');
console.log('✓ PASS: Desktop floating button remains available and mobile bottom nav is hidden on desktop.');

// ----------------------------------------------------
// Test 6: Recently Used Reuses Existing Workspace Implementation
// ----------------------------------------------------
console.log('\n--- Test 6: Recently Used Integration with workspace.js ---');
assert.ok(sharedUiSource.includes('#recent-tools'), 'Recent nav item links to #recent-tools shelf');
assert.ok(sharedUiSource.includes('recordRecentTool'), 'Workspace recordRecentTool is utilized');
console.log('✓ PASS: Recently Used integrates with existing single source of truth workspace.js.');

// ----------------------------------------------------
// Test 7: Safe-Area CSS and Content Clearance
// ----------------------------------------------------
console.log('\n--- Test 7: Safe-Area CSS & Content Clearance ---');
assert.ok(sharedUiSource.includes('env(safe-area-inset-bottom'), 'shared-ui-new.js must utilize env(safe-area-inset-bottom)');
assert.ok(toolPageCss.includes('env(safe-area-inset-bottom'), 'tool-page.css must utilize env(safe-area-inset-bottom)');
assert.ok(toolPageCss.includes('calc(84px + env(safe-area-inset-bottom, 0px)) !important;'), 'tool-page.css provides content clearance with safe-area inset');
assert.ok(sharedUiSource.includes('calc(84px + env(safe-area-inset-bottom, 0px));'), 'Site footer provides mobile safe-area clearance');
console.log('✓ PASS: Safe-area inset bottom and non-stacking content clearance verified.');

// ----------------------------------------------------
// Test 8: Exactly 18 Active Production Tools (Zero Archived)
// ----------------------------------------------------
console.log('\n--- Test 8: Catalogue Integrity (Exact 18 Tools) ---');
const totalTools = Object.keys(TOOL_ROUTES).length;
assert.equal(totalTools, 18, `Expected exactly 18 active production tools in routes.js, found ${totalTools}`);

const archivedPatterns = ['unit-converter', 'image-cropper', 'color-picker', 'markdown-preview'];
for (const [slug] of Object.entries(TOOL_ROUTES)) {
  for (const arch of archivedPatterns) {
    assert.notEqual(slug, arch, `Archived tool ${arch} must not appear in routes`);
  }
}
console.log('✓ PASS: Exactly 18 active production tools verified with zero archived tools.');

// ----------------------------------------------------
// Test 9: Icon Set Completeness
// ----------------------------------------------------
console.log('\n--- Test 9: Icon Set Completeness ---');
assert.ok(icons.home, 'icons.home must exist');
assert.ok(icons.tools, 'icons.tools must exist');
assert.ok(icons.history, 'icons.history must exist');
assert.ok(icons.sparkle, 'icons.sparkle must exist');
console.log('✓ PASS: All required SVG line icons exist in icons.js.');

console.log('\n========================================');
console.log('All Step 4.1 Mobile Bottom Navigation tests PASSED successfully!');
