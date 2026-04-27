import type { HealthMetrics, ScanResult, UserProfile } from "../types";

type Props = {
  profile: UserProfile;
  scan: ScanResult;
  metrics: HealthMetrics;
  onRestart: () => void;
};

const goalLabel = { lose: "Fat loss", maintain: "Maintenance", gain: "Muscle gain" } as const;

export function HealthReport({ profile, scan, metrics, onRestart }: Props) {
  return (
    <div className="card">
      <h2>Your health report</h2>
      <p style={{ margin: "0 0 1rem", color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.45 }}>
        Personalised estimates from your inputs, Deurenberg body fat, Mifflin–St Jeor energy needs, and a light
        resting-HR tweak after your scan (demo only).
      </p>

      <div className="report-grid">
        <div className="metric-tile">
          <h3>BMI</h3>
          <div className="value">{metrics.bmi}</div>
        </div>
        <div className="metric-tile">
          <h3>Body fat (Deurenberg)</h3>
          <div className="value">{metrics.bodyFatPct}%</div>
        </div>
        <div className="metric-tile">
          <h3>Lean mass (est.)</h3>
          <div className="value">{metrics.leanMassKg} kg</div>
        </div>
        <div className="metric-tile">
          <h3>Resting HR / HRV</h3>
          <div className="value">
            {scan.restingHr} bpm · {scan.hrvRmssd} ms
          </div>
        </div>
        <div className="metric-tile">
          <h3>BMR (base → scan-adjusted)</h3>
          <div className="value">
            {metrics.bmrBase} → {metrics.bmrAdjusted} kcal/day
          </div>
        </div>
        <div className="metric-tile">
          <h3>TDEE / target</h3>
          <div className="value">
            {metrics.tdee} / {metrics.targetCalories} kcal
          </div>
        </div>
      </div>

      <div className="section-title">Goal & macros</div>
      <div className="metric-tile">
        <div className="macro-row">
          <span>Goal</span>
          <strong>{goalLabel[profile.goal]}</strong>
        </div>
        <div className="macro-row">
          <span>Protein</span>
          <strong>{metrics.proteinG} g/day</strong>
        </div>
        <div className="macro-row">
          <span>Carbs</span>
          <strong>{metrics.carbG} g/day</strong>
        </div>
        <div className="macro-row">
          <span>Fats</span>
          <strong>{metrics.fatG} g/day</strong>
        </div>
      </div>

      <div className="section-title">Sample day</div>
      <ul className="schedule-list">
        {metrics.dailySchedule.map((row) => (
          <li key={`${row.time}-${row.label}`}>
            <time>{row.time}</time>
            <span>{row.label}</span>
          </li>
        ))}
      </ul>

      <div className="section-title">7-day plan</div>
      <ul className="workout-list">
        {metrics.workouts.map((w) => (
          <li key={w.day}>
            <strong>{w.day}</strong>
            <span>
              {w.title}
              {w.durationMin > 0 ? ` · ${w.durationMin} min` : ""}
            </span>
            <span className="burn">{w.estBurnKcal > 0 ? `~${w.estBurnKcal} kcal` : ""}</span>
          </li>
        ))}
      </ul>

      <button type="button" className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={onRestart}>
        Start over
      </button>
      <p className="disclaimer">
        Not medical advice. Real LED/PPG apps need validated algorithms, hardware calibration, and regulatory
        clearance where required.
      </p>
    </div>
  );
}
