import { useEffect, useRef, useState } from "react";
import { CameraOff, Flashlight, FlashlightOff, Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { playScanFeedback, unlockAudio } from "@/lib/pos/beep";
import { startScanSession, type ScanSession } from "@/lib/pos/scan-engine";
import { SEED_PRODUCTS } from "@/lib/pos/catalog";
import { cn } from "@/lib/utils";

type ScannerProps = {
  open: boolean;
  onClose: () => void;
  onCode: (code: string) => void;
  lastAdded?: string | null;
  captureOnce?: boolean;
  heading?: string;
};

export function Scanner({
  open,
  onClose,
  onCode,
  lastAdded,
  captureOnce = false,
  heading,
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<ScanSession | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [manual, setManual] = useState("");
  const [flash, setFlash] = useState(false);
  const [torch, setTorch] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const captureOnceRef = useRef(captureOnce);
  captureOnceRef.current = captureOnce;

  useEffect(() => {
    if (!open) return;
    setCameraError(false);
    setTorch(false);
    setTorchAvailable(false);
    unlockAudio();
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    void startScanSession(video, {
      onCode: (code) => {
        playScanFeedback();
        setFlash(true);
        window.setTimeout(() => setFlash(false), 120);
        onCodeRef.current(code);
        if (captureOnceRef.current) onCloseRef.current();
      },
      onError: () => {
        if (!cancelled) setCameraError(true);
      },
      onTorch: (available) => {
        if (!cancelled) setTorchAvailable(available);
      },
    }).then((session) => {
      if (cancelled) {
        session.stop();
        return;
      }
      sessionRef.current = session;
    });

    return () => {
      cancelled = true;
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  function submitManual() {
    const code = manual.trim();
    if (!code) return;
    playScanFeedback();
    onCode(code);
    setManual("");
    if (captureOnce) onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-fg text-primary-fg">
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
            <div className="relative h-32 w-[90%] max-w-sm">
              <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]" />
              <div className="absolute -top-px -left-px h-8 w-8 rounded-tl-2xl border-t-[3px] border-l-[3px] border-primary-fg" />
              <div className="absolute -top-px -right-px h-8 w-8 rounded-tr-2xl border-t-[3px] border-r-[3px] border-primary-fg" />
              <div className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-primary-fg" />
              <div className="absolute -right-px -bottom-px h-8 w-8 rounded-br-2xl border-r-[3px] border-b-[3px] border-primary-fg" />
              <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-danger shadow-[0_0_12px_2px_rgba(255,59,48,0.85)]" />
            </div>
          </div>
        )}
        {flash ? <div className="absolute inset-0 bg-primary-fg/35" /> : null}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-fg/60">
              Escáner
            </p>
            <p className="text-[17px] font-semibold">
              {heading ?? (captureOnce ? "Escanee el código de barras" : "Alinee el código de barras")}
            </p>
          </div>
          <div className="flex gap-2">
            {torchAvailable ? (
              <button
                type="button"
                onClick={() => {
                  const next = !torch;
                  setTorch(next);
                  void sessionRef.current?.setTorch(next);
                }}
                className="flex size-11 items-center justify-center rounded-full bg-primary-fg/15"
                aria-label={torch ? "Apagar linterna" : "Linterna"}
              >
                {torch ? <Flashlight className="size-5" /> : <FlashlightOff className="size-5" />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex size-11 items-center justify-center rounded-full bg-primary-fg/15"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
        {lastAdded && !captureOnce ? (
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
            {captureOnce ? "Usar" : "Agregar"}
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
                  if (captureOnce) onClose();
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
          {captureOnce ? "Cancelar" : "Listo"}
        </Button>
      </div>
    </div>
  );
}
