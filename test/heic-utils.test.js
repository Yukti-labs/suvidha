import assert from 'node:assert/strict';
import {
  isHeicFile,
  isValidImageFile,
  convertHeicToBrowserImage,
  prepareImageFiles
} from '../assets/js/modules/heic-utils.js';

console.log('=== Running HEIC/HEIF Image Upload & Conversion Tests ===\n');

// Mock Web File/Blob environment for Node.js
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

// Test 1: HEIC / HEIF file detection
console.log('--- Test 1: HEIC / HEIF Detection ---');
assert.strictEqual(isHeicFile(new MockFile([], 'photo.heic')), true, 'photo.heic must be detected');
assert.strictEqual(isHeicFile(new MockFile([], 'PHOTO.HEIC')), true, 'PHOTO.HEIC uppercase must be detected');
assert.strictEqual(isHeicFile(new MockFile([], 'image.heif')), true, 'image.heif must be detected');
assert.strictEqual(isHeicFile(new MockFile([], 'sample.HEIF')), true, 'sample.HEIF uppercase must be detected');
assert.strictEqual(isHeicFile(new MockBlob([], { type: 'image/heic' })), true, 'image/heic mime type must be detected');
assert.strictEqual(isHeicFile(new MockBlob([], { type: 'image/heif' })), true, 'image/heif mime type must be detected');
assert.strictEqual(isHeicFile(new MockBlob([], { type: 'image/heic-sequence' })), true, 'heic-sequence must be detected');

// Normal images must NOT be classified as HEIC
assert.strictEqual(isHeicFile(new MockFile([], 'photo.jpg')), false, 'photo.jpg must NOT be heic');
assert.strictEqual(isHeicFile(new MockFile([], 'photo.png')), false, 'photo.png must NOT be heic');
assert.strictEqual(isHeicFile(new MockFile([], 'photo.webp')), false, 'photo.webp must NOT be heic');
assert.strictEqual(isHeicFile(new MockFile([], 'doc.pdf')), false, 'doc.pdf must NOT be heic');
console.log('✓ PASS: HEIC and HEIF files are accurately detected across filenames and MIME types.');

// Test 2: Valid Image file detection (broad acceptance)
console.log('\n--- Test 2: Image File Validation ---');
assert.strictEqual(isValidImageFile(new MockFile([], 'photo.jpg')), true);
assert.strictEqual(isValidImageFile(new MockFile([], 'photo.jpeg')), true);
assert.strictEqual(isValidImageFile(new MockFile([], 'photo.png')), true);
assert.strictEqual(isValidImageFile(new MockFile([], 'photo.webp')), true);
assert.strictEqual(isValidImageFile(new MockFile([], 'photo.heic')), true);
assert.strictEqual(isValidImageFile(new MockFile([], 'photo.heif')), true);
assert.strictEqual(isValidImageFile(new MockFile([], 'document.pdf')), false);
assert.strictEqual(isValidImageFile(new MockFile([], 'data.json')), false);
console.log('✓ PASS: Image validator accepts JPG, PNG, WebP, HEIC, and HEIF while rejecting non-images.');

// Test 3: Normal image routing remains unchanged
console.log('\n--- Test 3: Normal Image Routing Unchanged ---');
const normalJpeg = new MockFile(['fake-jpeg-bytes'], 'vacation.jpg', { type: 'image/jpeg' });
const untouchedResult = await convertHeicToBrowserImage(normalJpeg);
assert.strictEqual(untouchedResult, normalJpeg, 'Standard JPG file must be returned untouched');
console.log('✓ PASS: Standard image files pass through the pipeline untouched.');

// Test 4: HEIC conversion with client-side decoder
console.log('\n--- Test 4: Client-Side HEIC to JPEG Conversion ---');
let progressUpdates = [];
globalThis.window = {
  heic2any: async ({ blob, toType }) => {
    assert.strictEqual(toType, 'image/jpeg');
    return new MockBlob(['converted-jpeg-data'], { type: 'image/jpeg' });
  }
};

const heicInput = new MockFile(['heic-raw-bytes'], 'IMG_1234.HEIC');
const convertedFile = await convertHeicToBrowserImage(heicInput, {
  onProgress: (msg) => progressUpdates.push(msg)
});

assert.strictEqual(convertedFile.name, 'IMG_1234.jpg', 'Output extension must be .jpg');
assert.strictEqual(convertedFile.type, 'image/jpeg', 'Output MIME type must be image/jpeg');
assert(progressUpdates.includes('Preparing HEIC image…'), 'Progress callback must be invoked with "Preparing HEIC image…"');
console.log('✓ PASS: HEIC successfully converted to JPEG File preserving base name with .jpg extension.');

// Test 5: Failed HEIC conversion produces user-friendly error path
console.log('\n--- Test 5: Failed HEIC Conversion Error Handling ---');
globalThis.window.heic2any = async () => {
  throw new Error('Corrupt HEIC bitstream');
};

const corruptHeic = new MockFile(['bad-bytes'], 'corrupt.heic');
await assert.rejects(
  async () => {
    await convertHeicToBrowserImage(corruptHeic);
  },
  {
    message: "This HEIC image couldn't be processed in your browser. Please try another image."
  },
  'Failed HEIC conversion must produce clear, user-friendly error message'
);
console.log('✓ PASS: Failed HEIC decoding produces expected user-facing error message with zero silent failure.');

// Test 6: Batch image preparation (mixed JPG and HEIC)
console.log('\n--- Test 6: Batch Image Preparation (Mixed Formats) ---');
globalThis.window.heic2any = async ({ blob }) => {
  return new MockBlob(['heic-to-jpeg'], { type: 'image/jpeg' });
};

const batch = [
  new MockFile(['jpg'], 'pic1.jpg', { type: 'image/jpeg' }),
  new MockFile(['heic'], 'pic2.heic'),
  new MockFile(['png'], 'pic3.png', { type: 'image/png' })
];

const batchResult = await prepareImageFiles(batch);
assert.strictEqual(batchResult.length, 3, 'All 3 images must be retained');
assert.strictEqual(batchResult[0].name, 'pic1.jpg');
assert.strictEqual(batchResult[1].name, 'pic2.jpg', 'HEIC item must be converted to .jpg');
assert.strictEqual(batchResult[2].name, 'pic3.png');
console.log('✓ PASS: Mixed file batches are correctly processed, converting HEIC and preserving standard formats.');

console.log('\n========================================');
console.log('All HEIC/HEIF tests PASSED successfully!');
