import { useMemo, useState } from "react";
import "./App.css";
import { OnboardingForm } from "./components/OnboardingForm";
import { PPGScan } from "./components/PPGScan";
import { HealthReport } from "./components/HealthReport";
import { computeHealth } from "./lib/health";
import type { ScanResult, UserProfile } from "./types";

const defaultProfile: UserProfile = {
  age: 32,
  gender: "male",
  weightKg: 78,
  heightCm: 178,
  activity: "moderate",
  goal: "maintain",
};

type Step = "form" | "scan" | "report";

export default function App() {
  const [step, setStep] = useState<Step>("form");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [scan, setScan] = useState<ScanResult | null>(null);

  const metrics = useMemo(() => {
    if (!scan) return null;
    return computeHealth(profile, scan);
  }, [profile, scan]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>VitalScan</h1>
        <p>Profile + simulated pulse capture → personalised energy, macros, and training sketch.</p>
      </header>

      {step === "form" && (
        <OnboardingForm value={profile} onChange={setProfile} onNext={() => setStep("scan")} />
      )}

      {step === "scan" && (
        <PPGScan
          profile={profile}
          onComplete={(payload) => {
            setScan({ ...payload, scanSeconds: payload.scanSeconds });
            setStep("report");
          }}
          onBack={() => setStep("form")}
        />
      )}

      {step === "report" && scan && metrics && (
        <HealthReport
          profile={profile}
          scan={scan}
          metrics={metrics}
          onRestart={() => {
            setScan(null);
            setStep("form");
          }}
        />
      )}
    </div>
  );
}
