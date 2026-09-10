// Centralized Client-Side HEIC/HEIF Image Conversion Utility for Suvidha Tools
// PRIVACY GUARANTEE:
// Conversion is performed 100% locally in the browser memory.
// Original and converted files are NEVER uploaded to any server.

/**
 * Detects whether a File or Blob is a HEIC or HEIF file.
 * @param {File|Blob} file 
 * @returns {boolean}
 */
export function isHeicFile(file) {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.heic') || name.endsWith('.heif')) {
    return true;
  }
  const type = (file.type || '').toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence'
  );
}

/**
 * Determines whether a file is an accepted image format (including HEIC/HEIF).
 * @param {File|Blob} file 
 * @returns {boolean}
 */
export function isValidImageFile(file) {
  if (!file) return false;
  if (isHeicFile(file)) return true;
  if (file.type && file.type.startsWith('image/')) return true;
  const name = (file.name || '').toLowerCase();
  return /\.(jpg|jpeg|png|webp|gif|svg|bmp|avif)$/i.test(name);
}

let _heicLoaderPromise = null;

/**
 * Dynamically loads the client-side HEIC conversion library (heic2any) if not already present.
 * @returns {Promise<Function>}
 */
export function loadHeicDecoder() {
  if (typeof window !== 'undefined' && typeof window.heic2any === 'function') {
    return Promise.resolve(window.heic2any);
  }
  if (_heicLoaderPromise) return _heicLoaderPromise;

  _heicLoaderPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      return reject(new Error('Document environment required to load HEIC script'));
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js';
    script.onload = () => {
      if (typeof window.heic2any === 'function') {
        resolve(window.heic2any);
      } else {
        reject(new Error('heic2any failed to initialize'));
      }
    };
    script.onerror = () => {
      // Fallback mirror if cdnjs fails
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
      fallbackScript.onload = () => {
        if (typeof window.heic2any === 'function') {
          resolve(window.heic2any);
        } else {
          reject(new Error('heic2any failed to initialize'));
        }
      };
      fallbackScript.onerror = () => reject(new Error('Failed to load HEIC decoder script'));
      document.head.appendChild(fallbackScript);
    };
    document.head.appendChild(script);
  });

  return _heicLoaderPromise;
}

/**
 * Converts a HEIC/HEIF file into a browser-compatible JPEG File object entirely client-side.
 * Normal image files are returned unchanged.
 * 
 * @param {File|Blob} file 
 * @param {Object} [options]
 * @param {Function} [options.onProgress] - Callback for visible status changes e.g. "Preparing HEIC image…"
 * @returns {Promise<File>}
 */
export async function convertHeicToBrowserImage(file, options = {}) {
  if (!file) throw new Error('No file provided');
  if (!isHeicFile(file)) {
    return file;
  }

  const { onProgress } = options;
  if (typeof onProgress === 'function') {
    onProgress('Preparing HEIC image…');
  }

  try {
    let decoder = typeof window !== 'undefined' ? window.heic2any : null;
    if (typeof decoder !== 'function') {
      decoder = await loadHeicDecoder();
    }

    const conversionResult = await decoder({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92
    });

    const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    if (!blob) {
      throw new Error('Conversion yielded empty blob');
    }

    const originalName = file.name || 'image.heic';
    const baseName = originalName.replace(/\.(heic|heif)$/i, '');
    const convertedFileName = `${baseName}.jpg`;

    const FileConstructor = typeof File !== 'undefined' ? File : class extends Blob {
      constructor(parts, name, opts) {
        super(parts, opts);
        this.name = name;
      }
    };

    return new FileConstructor([blob], convertedFileName, {
      type: 'image/jpeg',
      lastModified: file.lastModified || Date.now()
    });
  } catch (err) {
    console.error('[Suvidha HEIC Decoder]', err);
    throw new Error("This HEIC image couldn't be processed in your browser. Please try another image.");
  }
}

/**
 * Prepares an array or FileList of images, converting any HEIC/HEIF files to browser-compatible JPEG files.
 * Preserves JPG, PNG, WEBP, and other standard formats untouched.
 * 
 * @param {Array<File>|FileList} files
 * @param {Object} [options]
 * @param {Function} [options.onStatus] - Status label callback
 * @returns {Promise<Array<File>>}
 */
export async function prepareImageFiles(files, options = {}) {
  const { onStatus } = options;
  const list = Array.from(files || []);
  const validFiles = list.filter(isValidImageFile);
  const result = [];

  for (let i = 0; i < validFiles.length; i++) {
    const f = validFiles[i];
    if (isHeicFile(f)) {
      if (typeof onStatus === 'function') {
        const indexText = validFiles.length > 1 ? ` ${i + 1} of ${validFiles.length}` : '';
        onStatus(`Preparing HEIC image${indexText}…`);
      }
      const converted = await convertHeicToBrowserImage(f, {
        onProgress: onStatus
      });
      result.push(converted);
    } else {
      result.push(f);
    }
  }

  return result;
}
