// Sensory feedback utility: Web Vibration API & Web Audio Synthesizer

export function triggerHaptic(pattern: number | number[] = 15) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Haptics not supported or permitted on this device
    }
  }
}

// Gentle audio chime synthesizer for peaceful grounding & completion feedback
export function playGentleChime(freq: number = 432) {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = 2.5;

    // Primary gentle tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);

    // Subtle harmonic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 1.5, now);

    // Warm envelope
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.exponentialRampToValueAtTime(0.04, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.8);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch {
    // Audio context not allowed or supported
  }
}

// Backwards-compatible alias for existing imports
export const playSingingBowlChime = playGentleChime;

