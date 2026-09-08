let ctx: AudioContext | null = null;

export function playScanFeedback() {
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.07;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.stop(now + 0.09);
  } catch {
    /* audio optional */
  }
  navigator.vibrate?.(35);
}

export function playSuccessFeedback() {
  try {
    ctx ??= new AudioContext();
    const now = ctx.currentTime;
    for (const [i, freq] of [660, 880].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.12);
      osc.stop(now + i * 0.08 + 0.13);
    }
  } catch {
    /* audio optional */
  }
  navigator.vibrate?.([24, 40, 24]);
}
