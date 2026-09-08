const POS_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "itf",
] as const;

type ScanCallbacks = {
  onCode: (code: string) => void;
  onError: () => void;
  onTorch?: (available: boolean) => void;
};

export type ScanSession = {
  stop: () => void;
  setTorch: (on: boolean) => Promise<void>;
};

function sameCodeWindow(code: string, last: { value: string; at: number }, now: number) {
  return code === last.value && now - last.at < 420;
}

async function openCamera(): Promise<MediaStream> {
  const tries: MediaTrackConstraints[] = [
    {
      facingMode: { exact: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
    {
      facingMode: { ideal: "environment" },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
    { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    { facingMode: "environment" },
  ];
  let lastError: unknown;
  for (const video of tries) {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: false, video });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("camera");
}

async function tuneTrack(track: MediaStreamTrack) {
  const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
    torch?: boolean;
    focusMode?: string[];
    zoom?: { min: number; max: number };
    exposureMode?: string[];
  };
  const advanced: Record<string, unknown> = {};
  if (caps.focusMode?.includes("continuous")) advanced.focusMode = "continuous";
  if (caps.exposureMode?.includes("continuous")) advanced.exposureMode = "continuous";
  if (caps.zoom) {
    const min = caps.zoom.min ?? 1;
    const max = caps.zoom.max ?? 1;
    advanced.zoom = Math.min(max, Math.max(min, min + (max - min) * 0.12));
  }
  if (Object.keys(advanced).length > 0) {
    try {
      await track.applyConstraints({ advanced: [advanced] } as MediaTrackConstraints);
    } catch {
      /* constraints are best-effort */
    }
  }
  return Boolean(caps.torch);
}

export async function startScanSession(
  video: HTMLVideoElement,
  callbacks: ScanCallbacks,
): Promise<ScanSession> {
  let stopped = false;
  let raf = 0;
  let torchOn = false;
  let stream: MediaStream | null = null;
  let extraStop: (() => void) | undefined;
  const last = { value: "", at: 0 };

  const emit = (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    const now = performance.now();
    if (sameCodeWindow(code, last, now)) return;
    last.value = code;
    last.at = now;
    callbacks.onCode(code);
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    extraStop?.();
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
  };

  const setTorch = async (on: boolean) => {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: on }] } as unknown as MediaTrackConstraints);
      torchOn = on;
    } catch {
      /* iPhone older than 17.4 may ignore torch */
    }
  };

  try {
    stream = await openCamera();
    if (stopped) {
      stream.getTracks().forEach((t) => t.stop());
      return { stop, setTorch };
    }
    const track = stream.getVideoTracks()[0];
    if (track) {
      const hasTorch = await tuneTrack(track);
      callbacks.onTorch?.(hasTorch);
    }

    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.muted = true;
    video.playsInline = true;
    await video.play();

    if ("BarcodeDetector" in window) {
      extraStop = runNativeDetector(video, emit, () => stopped, (id) => {
        raf = id;
      });
    } else {
      extraStop = await runZxing(stream, video, emit);
    }
  } catch {
    if (!stopped) callbacks.onError();
  }

  return {
    stop,
    setTorch: async (on: boolean) => {
      if (on === torchOn) return;
      await setTorch(on);
    },
  };
}

function runNativeDetector(
  video: HTMLVideoElement,
  emit: (code: string) => void,
  isStopped: () => boolean,
  setRaf: (id: number) => void,
) {
  let inFlight = false;
  let detector: BarcodeDetector | null = null;

  void BarcodeDetector.getSupportedFormats()
    .catch(() => [...POS_FORMATS])
    .then((supported) => {
      if (isStopped()) return;
      const formats = POS_FORMATS.filter((f) => supported.includes(f));
      detector = new BarcodeDetector({
        formats: formats.length > 0 ? [...formats] : [...POS_FORMATS],
      });
    });

  const tick = () => {
    if (isStopped()) return;
    setRaf(requestAnimationFrame(tick));
    if (!detector || inFlight || video.readyState < 2) return;
    inFlight = true;
    detector
      .detect(video)
      .then((codes) => {
        const value = codes[0]?.rawValue;
        if (value) emit(value);
      })
      .catch(() => {
        /* keep looping */
      })
      .finally(() => {
        inFlight = false;
      });
  };
  setRaf(requestAnimationFrame(tick));
  return () => cancelAnimationFrame(0);
}

async function runZxing(stream: MediaStream, video: HTMLVideoElement, emit: (code: string) => void) {
  const { BarcodeFormat, BrowserMultiFormatOneDReader } = await import("@zxing/browser");
  const { DecodeHintType } = await import("@zxing/library");
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
  ]);
  const reader = new BrowserMultiFormatOneDReader(hints, {
    delayBetweenScanAttempts: 40,
    delayBetweenScanSuccess: 350,
  });
  const controls = await reader.decodeFromStream(stream, video, (result) => {
    const value = result?.getText();
    if (value) emit(value);
  });
  return () => controls.stop();
}
