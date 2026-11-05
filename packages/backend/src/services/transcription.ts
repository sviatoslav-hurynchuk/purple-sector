import crypto from 'crypto';
import { cache } from './cache';
import { findIconicTranscript } from './transcription-registry';

const TRANSCRIPT_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year (audio broadcasts are permanent)

export interface TranscriptResult {
  transcript: string | null;
  requiresApiKey: boolean;
  isIconic?: boolean;
}

/**
 * Returns speech-to-text transcription for an official FIA team radio MP3 URL.
 * 1. Checks Redis cache first.
 * 2. Checks built-in iconic radio moments registry.
 * 3. If an STT key is configured (Groq, OpenAI, or Gemini), executes transcription and caches result permanently.
 */
export async function getAudioTranscript(
  recordingUrl: string,
  driverNumber?: number
): Promise<TranscriptResult> {
  if (!recordingUrl || !recordingUrl.startsWith('http')) {
    return { transcript: null, requiresApiKey: false };
  }

  const hash = crypto.createHash('sha256').update(recordingUrl).digest('hex').slice(0, 32);
  const cacheKey = `f1:radio:transcript:v3:${hash}`;

  const cached = await cache.get<string | null>(cacheKey);
  if (cached !== null && cached !== undefined) {
    return { transcript: cached, requiresApiKey: false };
  }

  // Check iconic registry if driverNumber is supplied or extracted from URL
  let detectedNum = driverNumber;
  if (!detectedNum) {
    const match = recordingUrl.match(/_(\d{1,2})_\d{8}_/);
    if (match) detectedNum = parseInt(match[1], 10);
  }

  if (detectedNum) {
    const iconic = findIconicTranscript(detectedNum, recordingUrl);
    if (iconic) {
      await cache.set(cacheKey, iconic.quote, TRANSCRIPT_TTL_SECONDS);
      return { transcript: iconic.quote, requiresApiKey: false, isIconic: true };
    }
  }

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!groqKey && !openaiKey && !geminiKey) {
    return { transcript: null, requiresApiKey: true };
  }

  try {
    const audioRes = await fetch(recordingUrl, { signal: AbortSignal.timeout(8000) });
    if (!audioRes.ok) {
      return { transcript: null, requiresApiKey: false };
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const fileBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });

    const formData = new FormData();
    formData.append('file', fileBlob, 'radio.mp3');

    let endpoint: string;
    let authHeader: string;
    let modelName: string;

    if (groqKey) {
      endpoint = 'https://api.groq.com/openai/v1/audio/transcriptions';
      authHeader = `Bearer ${groqKey}`;
      modelName = 'whisper-large-v3-turbo';
    } else if (openaiKey) {
      endpoint = 'https://api.openai.com/v1/audio/transcriptions';
      authHeader = `Bearer ${openaiKey}`;
      modelName = 'whisper-1';
    } else {
      // Gemini Flash transcription
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const base64Audio = Buffer.from(arrayBuffer).toString('base64');
      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: 'Transcribe this official Formula 1 team radio broadcast clip verbatim. Output only the spoken words inside uppercase quotation marks.' },
                { inline_data: { mime_type: 'audio/mp3', data: base64Audio } },
              ],
            },
          ],
        }),
      });

      if (geminiRes.ok) {
        const geminiJson = await geminiRes.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
        if (text) {
          await cache.set(cacheKey, text, TRANSCRIPT_TTL_SECONDS);
          return { transcript: text, requiresApiKey: false };
        }
      }
      return { transcript: null, requiresApiKey: false };
    }

    formData.append('model', modelName);
    formData.append('response_format', 'json');

    const sttRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: formData,
      signal: AbortSignal.timeout(12000),
    });

    if (!sttRes.ok) {
      console.warn(`[Transcription] STT service returned HTTP ${sttRes.status} for ${recordingUrl}`);
      return { transcript: null, requiresApiKey: false };
    }

    const json = (await sttRes.json()) as { text?: string };
    const transcript = json.text ? json.text.trim() : null;

    if (transcript) {
      await cache.set(cacheKey, transcript, TRANSCRIPT_TTL_SECONDS);
    }

    return { transcript, requiresApiKey: false };
  } catch (err) {
    console.warn(`[Transcription] Failed to transcribe radio clip (${recordingUrl}):`, err instanceof Error ? err.message : err);
    return { transcript: null, requiresApiKey: false };
  }
}
