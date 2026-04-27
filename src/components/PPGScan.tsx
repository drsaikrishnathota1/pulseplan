import { useCallback, useEffect, useRef, useState } from "react";
import type { UserProfile } from "../types";
import { simulateScanDerivedMetrics } from "../lib/health";

const SCAN_SEC = 60;

type Props = {
  profile: UserProfile;
  onComplete: (payload: { restingHr: number; hrvRmssd: number; scanSeconds: number }) => void;
  onBack: () => void;
};

export function PPGScan({ profile, onComplete, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [liveHr, setLiveHr] = useState<number | null>(null);
  const [liveHrv, setLiveHrv] = useState<number | null>(null);
  const [finalScan, setFinalScan] = useState<{ restingHr: number; hrvRmssd: number; scanSeconds: number } | null>(
    null
  );

  const draw = useCallback(
    (tMs: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#050a10";
      ctx.fillRect(0, 0, w, h);

      const derived = simulateScanDerivedMetrics(profile, Math.floor(elapsed));
      const bpm = derived.restingHr;
      const hz = bpm / 60;
      const midY = h * 0.5;

      ctx.strokeStyle = "rgba(45, 212, 191, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const samples = Math.floor(w / 2);
      for (let i = 0; i < samples; i++) {
        const x = (i / samples) * w;
        const phase = tMs / 1000 * hz * Math.PI * 2 + i * 0.08;
        const beat = Math.pow(Math.max(0, Math.sin(phase)), 4) * 1.4;
        const y = midY - beat * h * 0.22 - Math.sin(phase * 3.1 + i * 0.02) * 3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(138, 160, 192, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();
    },
    [elapsed, profile]
  );

  useEffect(() => {
    if (phase !== "scanning") return;

    const loop = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const sec = (t - startRef.current) / 1000;
      setElapsed(Math.min(SCAN_SEC, sec));

      const whole = Math.floor(sec);
      const d = simulateScanDerivedMetrics(profile, whole);
      setLiveHr(d.restingHr);
      setLiveHrv(d.hrvRmssd);

      draw(t);

      if (sec >= SCAN_SEC) {
        setPhase("done");
        setFinalScan({
          restingHr: d.restingHr,
          hrvRmssd: d.hrvRmssd,
          scanSeconds: SCAN_SEC,
        });
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [phase, profile, draw]);

  useEffect(() => {
    if (phase !== "idle") return;
    const idleLoop = (t: number) => {
      draw(t);
      rafRef.current = requestAnimationFrame(idleLoop);
    };
    rafRef.current = requestAnimationFrame(idleLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, draw]);

  const start = () => {
    startRef.current = null;
    setElapsed(0);
    setFinalScan(null);
    setPhase("scanning");
  };

  const remaining = Math.max(0, Math.ceil(SCAN_SEC - elapsed));

  return (
    <div className="card ppg-wrap">
      <h2>LED pulse scan</h2>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.45 }}>
        Tap the circle to run a 60-second simulated PPG-style capture. Your profile shapes the demo vitals.
      </p>
      <div className="pulse-btn-wrap">
        <button
          type="button"
          className={`pulse-btn ${phase === "scanning" ? "scanning" : ""}`}
          onClick={start}
          disabled={phase === "scanning" || phase === "done"}
          aria-label="Start pulse scan"
        >
          <span className="pulse-inner">
            {phase === "idle" && <>Tap to<br />start scan</>}
            {phase === "scanning" && (
              <>
                Scanning
                <span className="timer">{remaining}s</span>
              </>
            )}
            {phase === "done" && <>Scan<br />complete</>}
          </span>
        </button>
      </div>
      <div className="ppg-canvas-wrap">
        <canvas ref={canvasRef} width={360} height={140} style={{ width: "100%", height: "auto", display: "block" }} />
      </div>
      <div className="ppg-stats">
        <div className="stat">
          <span>Est. resting HR</span>
          <strong>{liveHr ?? "—"}</strong>
        </div>
        <div className="stat">
          <span>HRV (RMSSD-style)</span>
          <strong>{liveHrv ?? "—"} ms</strong>
        </div>
      </div>
      {phase === "done" && finalScan && (
        <button type="button" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => onComplete(finalScan)}>
          View my health report
        </button>
      )}
      {phase !== "done" && (
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back to profile
        </button>
      )}
    </div>
  );
}
