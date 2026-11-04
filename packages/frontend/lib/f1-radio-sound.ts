/**
 * Plays the official Formula 1 TV broadcast team radio intro chime
 * using the browser Web Audio API with zero network latency and zero asset dependencies.
 * Matches the iconic double-beep radio intro tone used across FIA F1 television broadcasts.
 */

let sharedAudioContext: AudioContext | null = null;

export function playF1RadioChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

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

      // ── First Beep: ~1050 Hz (duration ~65ms) ──────────────────────────
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1050, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.065);

      // ── Second Beep: ~1580 Hz (duration ~85ms) ─────────────────────────
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1580, now + 0.08);
      gain2.gain.setValueAtTime(0.20, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.17);

      // Give 190ms for the chime to complete before resolving
      setTimeout(resolve, 190);
    } catch {
      resolve();
    }
  });
}
