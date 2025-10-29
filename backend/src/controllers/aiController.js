import Match from '../models/Match.js';
import User from '../models/User.js';

// Simpler integration: use Gemini REST API (v1), discover a supported model if needed
const API_BASE = 'https://generativelanguage.googleapis.com/v1';
const USER_MODEL = process.env.GEMINI_MODEL || '';

export const generatePickupLine = async (req, res) => {
  let modelName = null;
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({ message: 'AI not configured' });
    }

    const { matchId } = req.params;
    const match = await Match.findById(matchId);
    if (!match || !match.users.map(String).includes(String(req.user.id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const otherUserId = match.users.find((id) => String(id) !== String(req.user.id));
    const other = await User.findById(otherUserId).select('name age bio gender profileQuestions');
    if (!other) return res.status(404).json({ message: 'Match user not found' });

    const profileBits = [];
    if (other.name) profileBits.push(`Name: ${other.name}`);
    if (other.age) profileBits.push(`Age: ${other.age}`);
    if (other.gender) profileBits.push(`Gender: ${other.gender}`);
    if (other.bio) profileBits.push(`Bio: ${other.bio}`);
    if (other.profileQuestions?.musicGenres?.length) profileBits.push(`Music: ${other.profileQuestions.musicGenres.join(', ')}`);
    if (other.profileQuestions?.hobbies?.length) profileBits.push(`Hobbies: ${other.profileQuestions.hobbies.join(', ')}`);
    if (other.profileQuestions?.passions?.length) profileBits.push(`Passions: ${other.profileQuestions.passions.join(', ')}`);
    if (other.profileQuestions?.about) profileBits.push(`About: ${other.profileQuestions.about}`);

    const prompt = `You are helping with a dating chat opener. Create ONE short, respectful, playful pickup line tailored to this profile. Avoid anything creepy, explicit, or offensive. Keep it under 25 words. If you reference interests, do it lightly.

PROFILE:
${profileBits.join('\n')}

Return only the line, no quotes.`;

    // Try SDK first (as requested), then fallback to REST if SDK unavailable or fails
    const preferredModel = USER_MODEL || 'gemini-2.5-flash';
    modelName = preferredModel; // record attempted model for debug

    let line = null;
    try {
      line = await generateWithSdk(preferredModel, prompt, process.env.GEMINI_API_KEY);
    } catch (sdkErr) {
      // Fallback to REST v1 path with model discovery
      modelName = await chooseModel(USER_MODEL, process.env.GEMINI_API_KEY);
      line = await generateWithModel(modelName, prompt, process.env.GEMINI_API_KEY);
    }

    if (!line) {
      // No AI output produced
      return res.status(502).json({ message: 'AI returned no content' });
    }
    return res.json({ line });
  } catch (err) {
    console.error('AI error:', err?.status || '', err?.message || err);
    const status = err?.status === 404 ? 502 : 500;
    // In non-production, surface some debug context to help configuration
    const debug = process.env.NODE_ENV === 'production' ? undefined : {
      hint: 'Check GEMINI_API_KEY access and GEMINI_MODEL value. Try GET /api/ai/models',
      modelTried: modelName || undefined,
      errorStatus: err?.status || undefined
    };
    return res.status(status).json({ message: 'Failed to generate pickup line', ...debug });
  }
};

export const listAvailableModels = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({ message: 'AI not configured' });
    }
    const models = await listModels(process.env.GEMINI_API_KEY);
    const simplified = models.map((m) => ({
      name: m.name,
      displayName: m.displayName,
      generationMethods: m.supportedGenerationMethods
    }));
    return res.json({ count: simplified.length, models: simplified });
  } catch (err) {
    console.error('AI models error:', err?.status || '', err?.message || err);
    const status = err?.status === 404 ? 502 : 500;
    return res.status(status).json({ message: 'Failed to list AI models' });
  }
};

async function listModels(apiKey) {
  const urlV1 = `${API_BASE}/models?key=${encodeURIComponent(apiKey)}`;
  let r = await fetch(urlV1);
  if (!r.ok) {
    // Try v1beta fallback in case account/region exposes models only there
    const t1 = await safeText(r);
    const urlV1b = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    r = await fetch(urlV1b);
    if (!r.ok) {
      const t2 = await safeText(r);
      const e = new Error(`ListModels failed: v1=${t1} v1beta=${t2}`);
      e.status = r.status;
      throw e;
    }
  }
  const json = await r.json();
  return json.models || [];
}

async function chooseModel(userModel, apiKey) {
  // If user specified a model id, try v1 format automatically
  if (userModel) {
    // Accept both raw id (gemini-x) and fully-qualified (models/gemini-x)
    const id = userModel.startsWith('models/') ? userModel : `models/${userModel}`;
    return id;
  }
  const models = await listModels(apiKey);
  // Prefer flash-8b, then other flash, then pro
  const candidates = [
    /models\/gemini-2\.5-flash/i,
    /models\/gemini-2\.0-flash/i,
    /models\/gemini-1\.5-flash-8b/i,
    /models\/gemini-1\.5-flash/i,
    /models\/gemini-1\.0-pro/i,
    /models\/gemini-pro/i
  ];
  const supports = (m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent');
  for (const rx of candidates) {
    const m = models.find((mm) => rx.test(mm.name) && supports(mm));
    if (m) return m.name;
  }
  // Fallback: first model that supports generateContent
  const any = models.find((m) => supports(m));
  if (any) return any.name;
  const e = new Error('No Gemini models available for generateContent');
  e.status = 404;
  throw e;
}

async function generateWithModel(modelName, prompt, apiKey) {
  const name = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };
  // Try v1 first
  const urlV1 = `${API_BASE}/${encodeURIComponent(name)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let r = await fetch(urlV1, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    // Fallback to v1beta if not found or unsupported
    const t1 = await safeText(r);
    const urlV1b = `https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(name)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    r = await fetch(urlV1b, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const t2 = await safeText(r);
      const e = new Error(`Generate failed: v1=${t1} v1beta=${t2}`);
      e.status = r.status;
      throw e;
    }
  }
  const json = await r.json();
  const text = extractText(json).trim();
  return text.replace(/^\"|\"$/g, '');
}

// Optional SDK-based generation using @google/genai per user's request
async function generateWithSdk(userModel, prompt, apiKey) {
  if (!apiKey) {
    const e = new Error('Missing GEMINI_API_KEY');
    e.status = 501;
    throw e;
  }
  // Dynamic import to avoid hard dependency if package isn't installed yet
  let GoogleGenAI;
  try {
    ({ GoogleGenAI } = await import('@google/genai'));
  } catch (e) {
    const err = new Error('SDK @google/genai not installed');
    err.status = 501;
    throw err;
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = userModel || 'gemini-2.5-flash';
  const resp = await ai.models.generateContent({ model, contents: prompt });
  let text = '';
  if (resp && typeof resp.text !== 'undefined') {
    text = typeof resp.text === 'function' ? await resp.text() : resp.text;
  }
  if (!text && resp?.candidates?.length) {
    const parts = resp.candidates[0]?.content?.parts || [];
    text = parts.map((p) => p.text).filter(Boolean).join(' ');
  }
  return (text || '').trim();
}

function extractText(resp) {
  try {
    const cand = resp.candidates?.[0];
    const parts = cand?.content?.parts || [];
    const txt = parts.map((p) => p.text).filter(Boolean).join(' ');
    return txt || '';
  } catch {
    return '';
  }
}

async function safeText(r) {
  try { return await r.text(); } catch { return ''; }
}

