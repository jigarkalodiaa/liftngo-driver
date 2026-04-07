"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CameraIcon } from "@/components/icons";
import AppHeader from "@/components/layout/AppHeader";
import AuthGuard from "@/components/layout/AuthGuard";
import BottomCta from "@/components/layout/BottomCta";
import SelfieFaceGuideOverlay from "@/components/driver/SelfieFaceGuideOverlay";
import SelfieKycGuidelines from "@/components/driver/SelfieKycGuidelines";
import { useDriverSelfie } from "@/context/DriverSelfieContext";
import { DRIVER_ONBOARDING } from "@/lib/driver/onboardingRoutes";

type Phase = "opening" | "live" | "review" | "error";

function SelfieVerificationContent() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const { selfie, setSelfie, clearSelfie } = useDriverSelfie();

  const [phase, setPhase] = useState<Phase>("opening");
  const [progress, setProgress] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const start = Date.now();

    setPhase("opening");
    setProgress(0);

    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      setProgress(Math.min(95, (elapsed / 2400) * 95));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play();
        }
        const minOpen = 1200;
        const elapsed = Date.now() - start;
        if (elapsed < minOpen) await new Promise((r) => setTimeout(r, minOpen - elapsed));
        if (cancelled) return;
        setProgress(100);
        await new Promise((r) => setTimeout(r, 220));
        if (cancelled) return;
        cancelAnimationFrame(raf);
        setPhase("live");
      } catch {
        cancelAnimationFrame(raf);
        if (!cancelled) {
          setPhase("error");
          toast.error("Could not open camera. Allow access and try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopStream();
    };
  }, [retryKey, stopStream]);

  useEffect(() => {
    if (phase !== "live") return;
    const v = videoRef.current;
    const s = streamRef.current;
    if (!v || !s) return;
    v.srcObject = s;
    void v.play().catch(() => {});
  }, [phase]);

  const captureSelfie = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) {
      toast.error("Camera is not ready yet.");
      return;
    }
    setCapturing(true);
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) {
      setCapturing(false);
      toast.error("Camera preview is not ready.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCapturing(false);
      return;
    }
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        setCapturing(false);
        if (!blob) {
          toast.error("Could not capture image.");
          return;
        }
        const previewUrl = URL.createObjectURL(blob);
        setSelfie({
          blob,
          previewUrl,
          mimeType: blob.type || "image/jpeg",
          capturedAt: Date.now(),
        });
        stopStream();
        setPhase("review");
        toast.success("Selfie captured.");
      },
      "image/jpeg",
      0.92,
    );
  }, [setSelfie, stopStream]);

  const handleRetake = useCallback(() => {
    clearSelfie();
    setPhase("opening");
    setProgress(0);
    setRetryKey((k) => k + 1);
  }, [clearSelfie]);

  const handleContinue = useCallback(() => {
    routerRef.current.replace(DRIVER_ONBOARDING.vehicleType);
  }, []);

  const handleRetryError = useCallback(() => {
    setPhase("opening");
    setProgress(0);
    setRetryKey((k) => k + 1);
  }, []);

  /* ── Opening camera (full-screen, no app header) ── */
  if (phase === "opening") {
    return (
      <div className="flex min-h-dvh flex-col bg-white px-6 pb-8 pt-10">
        <h1 className="text-center text-lg font-bold leading-snug text-[#001B39]">
          Opening front camera for KYC Selfie
        </h1>
        <div className="mt-8">
          <SelfieKycGuidelines variant="card" />
        </div>
        <div className="mt-auto flex flex-col items-center pt-12">
          <p className="text-sm font-bold text-[#001B39]">Opening camera</p>
          <div className="mt-3 h-2 w-full max-w-[280px] overflow-hidden rounded-full bg-[#E8F5E9]">
            <div
              className="h-full rounded-full bg-[#4CAF50] transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <video ref={videoRef} className="sr-only" playsInline muted autoPlay />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-6">
        <p className="text-center text-sm text-[var(--color-text-secondary)]">
          We couldn&apos;t access your front camera. Check permissions in your browser settings.
        </p>
        <button
          type="button"
          onClick={handleRetryError}
          className="rounded-[var(--radius-standard)] bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <video ref={videoRef} className="sr-only" playsInline muted autoPlay />
      </div>
    );
  }

  /* ── Live capture & review ── */
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader title="Selfie Verification" />

      <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
        <h1 className="text-xl font-bold text-[var(--color-primary)]">Take a Selfie</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Please ensure your face is clearly visible within the circle and well-lit.
        </p>

        <div className="mt-6 flex flex-1 flex-col items-center">
          <div
            className="relative w-[min(100%,280px)] overflow-hidden rounded-full bg-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/5"
            style={{ aspectRatio: "1" }}
          >
            {phase === "live" ? (
              <>
                <video
                  ref={videoRef}
                  className="size-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                  playsInline
                  muted
                  autoPlay
                />
                <SelfieFaceGuideOverlay />
                <div className="pointer-events-none absolute inset-[10%] rounded-lg">
                  <span className="absolute left-0 top-0 size-4 rounded-tl-md border-l-[3px] border-t-[3px] border-[#FACC15]" />
                  <span className="absolute right-0 top-0 size-4 rounded-tr-md border-r-[3px] border-t-[3px] border-[#FACC15]" />
                  <span className="absolute bottom-0 left-0 size-4 rounded-bl-md border-b-[3px] border-l-[3px] border-[#FACC15]" />
                  <span className="absolute bottom-0 right-0 size-4 rounded-br-md border-b-[3px] border-r-[3px] border-[#FACC15]" />
                </div>
              </>
            ) : selfie?.previewUrl ? (
              // Blob preview from capture — OK for S3 upload pipeline
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selfie.previewUrl} alt="Your selfie" className="size-full object-cover" />
            ) : (
              <div className="size-full bg-neutral-800" />
            )}
          </div>

          {phase === "live" ? (
            <button
              type="button"
              onClick={captureSelfie}
              disabled={capturing}
              className="mt-8 flex w-full max-w-[320px] items-center justify-center gap-2 rounded-[var(--radius-standard)] bg-[var(--color-primary)] py-4 text-base font-semibold text-white disabled:opacity-50"
            >
              {capturing ? (
                <span className="inline-block size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CameraIcon className="text-white" />
              )}
              Capture Selfie
            </button>
          ) : null}

          {phase === "live" ? (
            <div className="mt-8 w-full max-w-[340px]">
              <SelfieKycGuidelines variant="row" />
            </div>
          ) : null}
        </div>
      </div>

      {phase === "review" ? (
        <div className="sticky bottom-0 space-y-3 border-t border-[var(--color-gray-100)] bg-white px-5 pb-6 pt-3">
          <button
            type="button"
            onClick={handleRetake}
            className="w-full rounded-[var(--radius-standard)] border-2 border-[var(--color-gray-300)] py-3.5 text-sm font-semibold text-[var(--color-text-primary)]"
          >
            Retake
          </button>
          <BottomCta label="Continue" onClick={handleContinue} />
        </div>
      ) : null}
    </div>
  );
}

export default function SelfieVerificationPage() {
  return (
    <AuthGuard>
      <SelfieVerificationContent />
    </AuthGuard>
  );
}
