let ctx: AudioContext | null = null;
let beepBuffer: AudioBuffer | null = null;
let lastBeepAt = 0;

function audio(): AudioContext {
  ctx ??= new AudioContext();
  return ctx;
}

/** Classic POS piezo: loud 2.6 kHz square burst (~90 ms). */
function buildBeep(context: AudioContext): AudioBuffer {
  const duration = 0.1;
  const sampleRate = context.sampleRate;
  const n = Math.floor(sampleRate * duration);
  const buffer = context.createBuffer(1, n, sampleRate);
  const data = buffer.getChannelData(0);
  const freq = 2650;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.003);
    const release = t > duration - 0.012 ? Math.max(0, (duration - t) / 0.012) : 1;
    const square = Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1;
    data[i] = square * attack * release * 0.92;
  }
  return buffer;
}

export function unlockAudio() {
  try {
    const context = audio();
    if (context.state === "suspended") void context.resume();
    beepBuffer ??= buildBeep(context);
  } catch {
    /* audio optional */
  }
}

export function playScanFeedback() {
  const now = performance.now();
  if (now - lastBeepAt < 130) return;
  lastBeepAt = now;
  try {
    const context = audio();
    if (context.state === "suspended") void context.resume();
    beepBuffer ??= buildBeep(context);
    const src = context.createBufferSource();
    const gain = context.createGain();
    src.buffer = beepBuffer;
    gain.gain.value = 1;
    src.connect(gain);
    gain.connect(context.destination);
    src.start(context.currentTime);
  } catch {
    /* audio optional */
  }
  navigator.vibrate?.([50, 30, 40]);
}

export function playSuccessFeedback() {
  try {
    const context = audio();
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    for (const [i, freq] of [1320, 1980].entries()) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.28, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.14);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.15);
    }
  } catch {
    /* audio optional */
  }
  navigator.vibrate?.([24, 40, 24]);
}
