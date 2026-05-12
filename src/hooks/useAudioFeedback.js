import { useCallback, useRef } from 'react';

/**
 * Generates beep/buzz sounds via the Web Audio API (no audio files needed).
 * Requires a user gesture first — browsers block audio until the user
 * interacts with the page.
 */
export function useAudioFeedback() {
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const playTone = useCallback((frequency, duration, type = 'square', gain = 0.3) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();

      osc.connect(amp);
      amp.connect(ctx.destination);

      osc.type      = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      amp.gain.setValueAtTime(gain, ctx.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* audio not available */ }
  }, []);

  // Short high-pitched beep — scan success / item added
  const beepSuccess = useCallback(() => {
    playTone(1200, 0.07, 'square', 0.25);
  }, [playTone]);

  // Low double-buzz — scan failure / out of stock
  const beepError = useCallback(() => {
    playTone(220, 0.15, 'sawtooth', 0.35);
    setTimeout(() => playTone(180, 0.15, 'sawtooth', 0.35), 180);
  }, [playTone]);

  return { beepSuccess, beepError };
}
