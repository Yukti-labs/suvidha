// Serverless Feedback Endpoint for Suvidha Tools (Vercel Serverless Function)
// Zero external npm dependencies — uses native runtime fetch and standard library.

export const DESTINATION_EMAIL = 'sujitjoshi258@gmail.com';

// Allowed feedback categories
export const ALLOWED_FEEDBACK_TYPES = [
  'Suggestion',
  'Bug Report',
  'Feature Request',
  'General Feedback',
  'Other'
];

// RFC 5322 compliant simplified email validator regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// In-memory rate limiting map (IP -> array of timestamps)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per 10 mins

/**
 * Validates client IP against in-memory sliding window rate limiter.
 */
export function checkRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  
  // Periodic cleanup of stale entries
  if (rateLimitMap.size > 1000) {
    for (const [key, list] of rateLimitMap.entries()) {
      const active = list.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, active);
      }
    }
  }

  return true;
}

/**
 * Sanitizes input page URL (strips query parameters and hashes to avoid data leaks)
 */
export function sanitizePageContext(pageUrl) {
  if (!pageUrl || typeof pageUrl !== 'string') return 'Suvidha Tools';
  try {
    const trimmed = pageUrl.trim().slice(0, 300);
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed);
      return `${parsed.origin}${parsed.pathname}`;
    }
    // Static page/tool title or relative path
    return trimmed.split('?')[0].split('#')[0];
  } catch {
    return 'Suvidha Tools';
  }
}

/**
 * Validates feedback payload strictly server-side.
 */
export function validateFeedbackPayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body format' };
  }

  const { type, message, feedback, name, email } = body;
  const rawMessage = message || feedback;

  // 1. Feedback Type Validation
  if (!type || typeof type !== 'string' || !ALLOWED_FEEDBACK_TYPES.includes(type.trim())) {
    return {
      valid: false,
      error: `Invalid feedback type. Allowed types: ${ALLOWED_FEEDBACK_TYPES.join(', ')}`
    };
  }

  // 2. Feedback Message Validation
  if (!rawMessage || typeof rawMessage !== 'string') {
    return { valid: false, error: 'Feedback message is required' };
  }
  const cleanMessage = rawMessage.trim();
  if (cleanMessage.length < 10) {
    return { valid: false, error: 'Feedback message must be at least 10 characters' };
  }
  if (cleanMessage.length > 2000) {
    return { valid: false, error: 'Feedback message cannot exceed 2000 characters' };
  }

  // 3. Name Validation (Optional)
  let cleanName = 'Not provided';
  if (name !== undefined && name !== null && String(name).trim() !== '') {
    if (typeof name !== 'string') {
      return { valid: false, error: 'Name must be a string' };
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return { valid: false, error: 'Name cannot exceed 100 characters' };
    }
    cleanName = trimmedName;
  }

  // 4. Email Validation (Optional)
  let cleanEmail = 'Not provided';
  if (email !== undefined && email !== null && String(email).trim() !== '') {
    if (typeof email !== 'string') {
      return { valid: false, error: 'Email must be a string' };
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 254) {
      return { valid: false, error: 'Email cannot exceed 254 characters' };
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return { valid: false, error: 'Invalid email address format' };
    }
    cleanEmail = trimmedEmail;
  }

  const cleanPage = sanitizePageContext(body.page);

  return {
    valid: true,
    data: {
      type: type.trim(),
      message: cleanMessage,
      name: cleanName,
      email: cleanEmail,
      page: cleanPage
    }
  };
}

/**
 * Builds standard email subject and plain text body.
 */
export function buildFeedbackEmail({ type, message, name, email, page, timestamp }) {
  const subject = `Suvidha: Feedback — ${type}`;
  const submittedAt = timestamp || new Date().toISOString();

  const textBody = [
    'Suvidha Feedback',
    '',
    'Type:',
    type,
    '',
    'Feedback:',
    message,
    '',
    'Name:',
    name || 'Not provided',
    '',
    'Email:',
    email || 'Not provided',
    '',
    'Page:',
    page || 'Suvidha Tools',
    '',
    'Submitted:',
    submittedAt
  ].join('\n');

  return { subject, textBody, submittedAt };
}

/**
 * Sends email via server-side HTTPS transactional email API using native fetch.
 */
export async function sendEmailViaApi({ subject, textBody, replyToEmail }) {
  const apiKey = process.env.FEEDBACK_EMAIL_API_KEY || process.env.RESEND_API_KEY;
  const apiUrl = process.env.FEEDBACK_EMAIL_API_URL || 'https://api.resend.com/emails';
  const fromEmail = process.env.FEEDBACK_EMAIL_FROM || 'Suvidha Feedback <feedback@suvidhatools.in>';

  if (!apiKey) {
    // In local development or preview without API key configured, return dev mock success
    return { success: true, devMode: true };
  }

  const payload = {
    from: fromEmail,
    to: [DESTINATION_EMAIL],
    subject,
    text: textBody
  };

  if (replyToEmail && replyToEmail !== 'Not provided' && EMAIL_REGEX.test(replyToEmail)) {
    payload.reply_to = replyToEmail;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown HTTP error');
    throw new Error(`Email API responded with status ${response.status}: ${errorText}`);
  }

  return { success: true };
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Only POST requests are supported.'
    });
  }

  // Rate Limiting check by client IP
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many feedback submissions. Please wait a few minutes before trying again.'
    });
  }

  // Parse Body & check payload size limit (10 KB)
  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > 10240) {
      return res.status(413).json({ success: false, error: 'Payload too large' });
    }
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ success: false, error: 'Malformed JSON in request body' });
    }
  }

  const validation = validateFeedbackPayload(body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  const { type, message, name, email, page } = validation.data;
  const { subject, textBody } = buildFeedbackEmail({
    type,
    message,
    name,
    email,
    page,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await sendEmailViaApi({
      subject,
      textBody,
      replyToEmail: email !== 'Not provided' ? email : null
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback successfully sent',
      devMode: result.devMode || undefined
    });
  } catch (error) {
    // Return standard friendly error without exposing internal error trace to user
    return res.status(500).json({
      success: false,
      error: "Couldn't send your feedback right now. Please try again."
    });
  }
}
