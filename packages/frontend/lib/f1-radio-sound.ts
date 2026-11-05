/**
 * Plays the official Formula 1 TV broadcast team radio intro chime.
 * The chime volume is calibrated to match the perceived loudness of the compressed
 * cockpit vocal stream (~0.32 of full scale), preventing ear-splitting volume spikes.
 * 1. Attempts to play the user-provided audio asset at `/sounds/f1-radio-intro.mp3`.
 * 2. If the file is not yet placed in public/sounds, falls back to a Web Audio API chime.
 */

let sharedAudioContext: AudioContext | null = null;
const INTRO_CHIME_ATTENUATION = 0.32; // Calibrated to match radio speech decibels without blasting

export function playF1RadioChime(volume = 1): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (volume <= 0) {
      resolve();
      return;
    }

    // Normalize volume to [0, 1] range regardless of whether caller passes 0..1 or 0..100
    const normalized = volume > 1 ? (volume <= 100 ? volume / 100 : 1) : volume;
    const targetVolume = Math.min(1, Math.max(0, normalized * INTRO_CHIME_ATTENUATION));

    // 1. Try to play the dedicated audio asset `/sounds/f1-radio-intro.mp3`
    const audio = new Audio('/sounds/f1-radio-intro.mp3');
    audio.volume = targetVolume;

    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    // Safety timeout in case the file is long or event fails
    const timer = setTimeout(finish, 850);

    audio.onended = () => {
      clearTimeout(timer);
      finish();
    };

    audio.onerror = () => {
      clearTimeout(timer);
      // Fallback: Web Audio API synthesis
      playWebAudioFallback(normalized).then(finish);
    };

    audio.play().catch(() => {
      clearTimeout(timer);
      playWebAudioFallback(normalized).then(finish);
    });
  });
}

function playWebAudioFallback(volume = 1): Promise<void> {
  return new Promise((resolve) => {
    if (volume <= 0) {
      resolve();
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        resolve();
        return;
      }

      if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
        sharedAudioContext = new AudioCtx();
      }

      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().catch(() => {});
      }

      const ctx = sharedAudioContext;
      const now = ctx.currentTime;
      // Soft, balanced chime gain matching the vocal level without harsh clipping
      const gainVal = Math.min(0.35, Math.max(0.02, volume * 0.22));

      // Tone 1: ~1050 Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1050, now);
      gain1.gain.setValueAtTime(gainVal, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.07);

      // Tone 2: ~1580 Hz
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1580, now + 0.08);
      gain2.gain.setValueAtTime(gainVal * 1.05, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.18);

      setTimeout(resolve, 200);
    } catch {
      resolve();
    }
  });
}
