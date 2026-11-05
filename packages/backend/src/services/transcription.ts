import crypto from 'crypto';
import { cache } from './cache';

const TRANSCRIPT_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 year (audio broadcasts are permanent)
const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB maximum audio payload limit

export interface TranscriptResult {
  transcript: string | null;
  requiresApiKey: boolean;
}

// In-flight coalescing map to prevent duplicate concurrent STT calls for the same clip
const inFlightTranscripts = new Map<string, Promise<TranscriptResult>>();

/**
 * Returns speech-to-text transcription for an official FIA team radio MP3 URL.
 * 1. Validates HTTPS protocol and formula1.com origin.
 * 2. Checks Redis cache first.
 * 3. Coalesces concurrent cache misses into a single in-flight promise.
 * 4. If an STT key is configured (Groq, OpenAI, or Gemini), executes transcription and caches result permanently.
 */
export async function getAudioTranscript(
  recordingUrl: string,
  _driverNumber?: number
): Promise<TranscriptResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(recordingUrl);
  } catch {
    return { transcript: null, requiresApiKey: false };
  }

  const host = parsedUrl.hostname;
  const isAllowedHost = host === 'formula1.com' || host.endsWith('.formula1.com');
  if (parsedUrl.protocol !== 'https:' || !isAllowedHost) {
    return { transcript: null, requiresApiKey: false };
  }

  const hash = crypto.createHash('sha256').update(parsedUrl.href).digest('hex').slice(0, 32);
  const cacheKey = `f1:radio:transcript:v3:${hash}`;

  const cached = await cache.get<string | null>(cacheKey);
  if (cached !== null && cached !== undefined) {
    return { transcript: cached, requiresApiKey: false };
  }

  const existingInFlight = inFlightTranscripts.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const executeTranscription = async (): Promise<TranscriptResult> => {
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !openaiKey && !geminiKey) {
      return { transcript: null, requiresApiKey: true };
    }

    try {
      const audioRes = await fetch(parsedUrl.href, { signal: AbortSignal.timeout(8000) });
      if (!audioRes.ok) {
        return { transcript: null, requiresApiKey: false };
      }

      const contentLength = audioRes.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_AUDIO_BYTES) {
        return { transcript: null, requiresApiKey: false };
      }

      const arrayBuffer = await audioRes.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_AUDIO_BYTES) {
        return { transcript: null, requiresApiKey: false };
      }

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
          signal: AbortSignal.timeout(12000),
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
          const geminiJson = (await geminiRes.json()) as {
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
        console.warn(`[Transcription] STT service returned HTTP ${sttRes.status} for ${parsedUrl.href}`);
        return { transcript: null, requiresApiKey: false };
      }

      const json = (await sttRes.json()) as { text?: string };
      const transcript = json.text ? json.text.trim() : null;

      if (transcript) {
        await cache.set(cacheKey, transcript, TRANSCRIPT_TTL_SECONDS);
      }

      return { transcript, requiresApiKey: false };
    } catch (err) {
      console.warn(`[Transcription] Failed to transcribe radio clip (${parsedUrl.href}):`, err instanceof Error ? err.message : err);
      return { transcript: null, requiresApiKey: false };
    }
  };

  const promise = executeTranscription().finally(() => {
    inFlightTranscripts.delete(cacheKey);
  });

  inFlightTranscripts.set(cacheKey, promise);
  return promise;
}
