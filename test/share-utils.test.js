import assert from 'node:assert/strict';
import {
  ATTRIBUTIONS,
  FALLBACK_MESSAGE,
  getAttributionText,
  canShareFiles,
  shareFile,
  shareText
} from '../assets/js/modules/share-utils.js';

console.log('=== Running Step 4.2: File Sharing & Suvidha Attribution Tests ===\n');

// Mock Web environment
class MockBlob {
  constructor(parts = [], options = {}) {
    this.parts = parts;
    this.type = options.type || '';
    this.size = parts.reduce((acc, p) => acc + (p.length || 0), 0);
  }
}

class MockFile extends MockBlob {
  constructor(parts, name, options = {}) {
    super(parts, options);
    this.name = name;
    this.lastModified = Date.now();
  }
}

globalThis.Blob = MockBlob;
globalThis.File = MockFile;

// Test 1: Attribution copy validation
console.log('--- Test 1: Attribution Copy & Domain Verification ---');
for (const [tool, text] of Object.entries(ATTRIBUTIONS)) {
  assert(text.includes('https://www.suvidhatools.in'), `Attribution for ${tool} must contain official domain`);
  assert(!text.includes('Try our amazing tool'), `Attribution for ${tool} must not have aggressive advertising`);
  assert(!text.includes('Click here'), `Attribution for ${tool} must not have spammy marketing`);
  assert(!text.includes('Best PDF compressor'), `Attribution for ${tool} must not have promotional superlative`);
}

assert.strictEqual(
  getAttributionText('image-to-pdf'),
  'Converted to PDF with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in'
);
assert.strictEqual(
  getAttributionText('pdf-compressor'),
  'Compressed with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in'
);
assert.strictEqual(
  getAttributionText('pdf-merger'),
  'Merged with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in'
);
assert.strictEqual(
  getAttributionText('pdf-unlock'),
  'Processed with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in'
);
assert.strictEqual(
  getAttributionText('image-compressor'),
  'Compressed with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in'
);
assert.strictEqual(
  getAttributionText('resume-builder'),
  'Created with Suvidha Tools.\nhttps://www.suvidhatools.in'
);
assert.strictEqual(
  getAttributionText('qr-generator'),
  'Created with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in'
);
assert.strictEqual(
  getAttributionText('unknown-tool'),
  'Made with Suvidha Tools — privacy-first browser tools.\nhttps://www.suvidhatools.in'
);
console.log('✓ PASS: All tool attributions match exact subtle specifications and official domain.');

// Test 2: Absolute rule - shareFile NEVER accepts or shares blob URLs
console.log('\n--- Test 2: Absolute Rule: Never Share Blob URLs ---');
let shareCalls = [];
const mockNavigator = {
  canShare: ({ files }) => Boolean(files && files.length > 0),
  share: async (payload) => {
    shareCalls.push(payload);
    return Promise.resolve();
  }
};
Object.defineProperty(globalThis, 'navigator', {
  value: mockNavigator,
  configurable: true,
  writable: true
});

const analyticsEvents = [];
globalThis.window = {
  suvidhaAnalytics: {
    shareClicked: (tool) => analyticsEvents.push({ event: 'share_clicked', tool }),
    shareSuccess: (tool) => analyticsEvents.push({ event: 'share_success', tool }),
    shareFallbackDownload: (tool) => analyticsEvents.push({ event: 'share_fallback_download', tool })
  }
};

// Attempt passing a blob URL string directly to shareFile
const blobUrlAttempt = await shareFile('blob:https://www.suvidhatools.in/1234-5678', {
  toolSlug: 'image-to-pdf'
});
assert.strictEqual(blobUrlAttempt.success, false, 'Passing string URL to shareFile must be rejected');
assert.strictEqual(shareCalls.length, 0, 'No share call must occur when string/blob URL is passed');
assert.strictEqual(blobUrlAttempt.error, 'invalid_file_payload');
console.log('✓ PASS: Strings and blob: URLs are strictly rejected from shareFile.');

// Test 3: Actual file sharing uses files: [file] and passes attribution
console.log('\n--- Test 3: Actual File Sharing with files: [file] ---');
shareCalls = [];
analyticsEvents.length = 0;

const testPdfBlob = new MockBlob(['%PDF-1.4...'], { type: 'application/pdf' });
const fileShareResult = await shareFile(testPdfBlob, {
  filename: 'my_converted.pdf',
  toolSlug: 'image-to-pdf',
  action: 'Converted to PDF'
});

assert.strictEqual(fileShareResult.success, true);
assert.strictEqual(fileShareResult.method, 'files');
assert.strictEqual(shareCalls.length, 1);

const receivedPayload = shareCalls[0];
assert(Array.isArray(receivedPayload.files), 'Payload must have files array');
assert.strictEqual(receivedPayload.files.length, 1);
assert.strictEqual(receivedPayload.files[0].name, 'my_converted.pdf');
assert.strictEqual(receivedPayload.files[0].type, 'application/pdf');
assert.strictEqual(receivedPayload.url, undefined, 'CRITICAL: Payload must NEVER contain url property');
assert(receivedPayload.text.includes('https://www.suvidhatools.in'), 'Payload must include Suvidha attribution');
assert(receivedPayload.text.includes('Converted to PDF with Suvidha Tools'), 'Payload must have action-tailored text');

// Verify sanitized analytics
assert.deepStrictEqual(analyticsEvents, [
  { event: 'share_clicked', tool: 'image-to-pdf' },
  { event: 'share_success', tool: 'image-to-pdf' }
]);
console.log('✓ PASS: Actual File instance shared via files: [file] with attribution and zero URL leaks.');

// Test 4: Unsupported file sharing triggers safe download fallback
console.log('\n--- Test 4: Unsupported File Sharing Fallback ---');
shareCalls = [];
analyticsEvents.length = 0;

// Simulate browser that does NOT support sharing files (e.g. desktop or older browser)
globalThis.navigator.canShare = () => false;

let fallbackMessageReceived = '';
const unsupportedResult = await shareFile(testPdfBlob, {
  filename: 'compressed.pdf',
  toolSlug: 'pdf-compressor',
  onFallback: (msg) => {
    fallbackMessageReceived = msg;
  }
});

assert.strictEqual(unsupportedResult.success, false);
assert.strictEqual(unsupportedResult.fallback, 'download');
assert.strictEqual(shareCalls.length, 0, 'No share call when files cannot be shared');
assert.strictEqual(fallbackMessageReceived, FALLBACK_MESSAGE);
assert(fallbackMessageReceived.includes("Your browser can't share files directly"));
assert(fallbackMessageReceived.includes("Download the file and attach it"));

assert.deepStrictEqual(analyticsEvents, [
  { event: 'share_clicked', tool: 'pdf-compressor' },
  { event: 'share_fallback_download', tool: 'pdf-compressor' }
]);
console.log('✓ PASS: Unsupported file sharing provides friendly download fallback without sharing blob URL.');

// Test 5: Text-only sharing remains text-only and rejects blob URLs
console.log('\n--- Test 5: Text-Only Sharing Safeguards ---');
shareCalls = [];
analyticsEvents.length = 0;
globalThis.navigator.canShare = () => true;

// Text share with page URL
await shareText({
  title: 'Suvidha Image to PDF',
  text: 'Free private Image to PDF converter',
  url: 'https://www.suvidhatools.in/pages/image/image-to-pdf.html',
  toolSlug: 'image-to-pdf'
});

assert.strictEqual(shareCalls.length, 1);
assert.strictEqual(shareCalls[0].url, 'https://www.suvidhatools.in/pages/image/image-to-pdf.html');

// Text share with blob: URL must be stripped
shareCalls = [];
await shareText({
  title: 'Check this',
  text: 'Look at my file',
  url: 'blob:https://www.suvidhatools.in/abcd-1234',
  toolSlug: 'pdf-merger'
});
assert.strictEqual(shareCalls.length, 1);
assert.strictEqual(shareCalls[0].url, undefined, 'Blob URL must be stripped from shareText payload');
console.log('✓ PASS: Text-only sharing preserves clean links and strictly strips any blob: URLs.');

// Test 6: Privacy Positioning Copy Compliance
console.log('\n--- Test 6: Privacy Positioning Copy Compliance ---');
const prohibitedPhrases = [
  'Your file never creates a URL',
  'Nothing ever leaves your device',
  '100% private',
  'Completely anonymous'
];
for (const phrase of prohibitedPhrases) {
  assert(!FALLBACK_MESSAGE.toLowerCase().includes(phrase.toLowerCase()), `Fallback message must not contain "${phrase}"`);
  for (const attr of Object.values(ATTRIBUTIONS)) {
    assert(!attr.toLowerCase().includes(phrase.toLowerCase()), `Attribution must not contain "${phrase}"`);
  }
}
console.log('✓ PASS: Share module adheres to Suvidha privacy positioning with zero unsupported claims.');

console.log('\n========================================');
console.log('All Step 4.2 File Sharing & Attribution tests PASSED successfully!');
