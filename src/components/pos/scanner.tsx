import { useEffect, useRef, useState } from "react";
import { CameraOff, Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { playScanFeedback } from "@/lib/pos/beep";
import { SEED_PRODUCTS } from "@/lib/pos/catalog";
import { cn } from "@/lib/utils";

type ScannerProps = {
  open: boolean;
  onClose: () => void;
  onCode: (code: string) => void;
  lastAdded?: string | null;
};

export function Scanner({ open, onClose, onCode, lastAdded }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const [manual, setManual] = useState("");
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const lastCode = useRef({ value: "", at: 0 });

  useEffect(() => {
    if (!open) return;
    setCameraError(false);
    let cancelled = false;
    let raf = 0;
    let stop: (() => void) | undefined;
    const video = videoRef.current;

    async function start() {
      if (!video) return;
      try {
        if ("BarcodeDetector" in window) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          video.srcObject = stream;
          video.setAttribute("playsinline", "true");
          video.muted = true;
          await video.play();
          const detector = new BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
          });
          const tick = async () => {
            if (cancelled) return;
            try {
              if (video.readyState >= 2) {
                const codes = await detector.detect(video);
                const value = codes[0]?.rawValue?.trim();
                if (value) emit(value);
              }
            } catch {
              /* keep looping */
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          stop = () => stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const { BarcodeFormat, BrowserMultiFormatReader } = await import("@zxing/browser");
        const { DecodeHintType } = await import("@zxing/library");
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.QR_CODE,
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        const controls = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" } } },
          video,
          (result) => {
            const value = result?.getText()?.trim();
            if (value) emit(value);
          },
        );
        stop = () => controls.stop();
      } catch {
        if (!cancelled) setCameraError(true);
      }
    }

    function emit(code: string) {
      const now = Date.now();
      if (code === lastCode.current.value && now - lastCode.current.at < 1200) return;
      lastCode.current = { value: code, at: now };
      playScanFeedback();
      onCodeRef.current(code);
    }

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stop?.();
      if (video) {
        const stream = video.srcObject as MediaStream | null;
        stream?.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
    };
  }, [open]);

  if (!open) return null;

  function submitManual() {
    const code = manual.trim();
    if (!code) return;
    playScanFeedback();
    onCode(code);
    setManual("");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-fg text-primary-fg">
      <div className="relative min-h-0 flex-1">
        <video
          ref={videoRef}
          className={cn("absolute inset-0 size-full object-cover", cameraError && "hidden")}
          playsInline
          muted
          autoPlay
        />
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <CameraOff className="size-10 opacity-70" />
            <p className="max-w-xs text-[15px] text-primary-fg/80">
              La cámara no está disponible aquí. Escriba el código o elija un producto de
              muestra.
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-[86%] max-w-sm rounded-2xl border-2 border-primary-fg/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-fg/60">
              Escáner
            </p>
            <p className="text-[17px] font-semibold">Alinee el código de barras</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full bg-primary-fg/15"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        {lastAdded ? (
          <div className="absolute inset-x-4 top-24 rounded-2xl bg-success/90 px-4 py-3 text-[15px] font-medium">
            Agregado: {lastAdded}
          </div>
        ) : null}
      </div>

      <div className="glass-sheet space-y-3 rounded-t-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-fg">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitManual();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Keyboard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              inputMode="numeric"
              placeholder="Escribir código"
              className="pl-10"
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={!manual.trim()}>
            Agregar
          </Button>
        </form>
        {cameraError ? (
          <div className="grid grid-cols-2 gap-2">
            {SEED_PRODUCTS.slice(0, 6).map((p) => (
              <button
                key={p.barcode}
                type="button"
                onClick={() => {
                  playScanFeedback();
                  onCode(p.barcode);
                }}
                className="rounded-xl bg-fill px-3 py-2.5 text-left active:scale-[0.98]"
              >
                <p className="truncate text-[13px] font-medium">{p.name}</p>
                <p className="font-mono text-[11px] text-muted">{p.barcode}</p>
              </button>
            ))}
          </div>
        ) : null}
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Listo
        </Button>
      </div>
    </div>
  );
}
