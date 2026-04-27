import type { ActivityLevel, Gender, Goal, UserProfile } from "../types";

type Props = {
  value: UserProfile;
  onChange: (next: UserProfile) => void;
  onNext: () => void;
};

const activityLabels: Record<ActivityLevel, string> = {
  sedentary: "Mostly desk / little exercise",
  light: "Light exercise 1–3 days/week",
  moderate: "Moderate 3–5 days/week",
  active: "Hard training 6–7 days/week",
  very_active: "Athlete / physical job + training",
};

export function OnboardingForm({ value, onChange, onNext }: Props) {
  const valid =
    value.age >= 13 &&
    value.age <= 100 &&
    value.weightKg > 25 &&
    value.weightKg < 300 &&
    value.heightCm > 100 &&
    value.heightCm < 250;

  return (
    <div className="card">
      <h2>Your profile</h2>
      <div className="row">
        <div className="field">
          <label htmlFor="age">Age</label>
          <input
            id="age"
            type="number"
            min={13}
            max={100}
            value={value.age || ""}
            onChange={(e) => onChange({ ...value, age: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            value={value.gender}
            onChange={(e) => onChange({ ...value, gender: e.target.value as Gender })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            id="weight"
            type="number"
            min={30}
            max={250}
            step={0.1}
            value={value.weightKg || ""}
            onChange={(e) => onChange({ ...value, weightKg: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label htmlFor="height">Height (cm)</label>
          <input
            id="height"
            type="number"
            min={120}
            max={230}
            value={value.heightCm || ""}
            onChange={(e) => onChange({ ...value, heightCm: Number(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="activity">Activity level</label>
        <select
          id="activity"
          value={value.activity}
          onChange={(e) => onChange({ ...value, activity: e.target.value as ActivityLevel })}
        >
          {(Object.keys(activityLabels) as ActivityLevel[]).map((k) => (
            <option key={k} value={k}>
              {activityLabels[k]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="goal">Goal</label>
        <select
          id="goal"
          value={value.goal}
          onChange={(e) => onChange({ ...value, goal: e.target.value as Goal })}
        >
          <option value="lose">Lose fat</option>
          <option value="maintain">Maintain</option>
          <option value="gain">Build muscle</option>
        </select>
      </div>
      <button type="button" className="btn btn-primary" disabled={!valid} onClick={onNext}>
        Next: Heart rate scan
      </button>
      <p className="disclaimer">
        VitalScan is a wellness demo, not a medical device. Heart scan is simulated for prototyping; do not use
        for diagnosis or treatment.
      </p>
    </div>
  );
}
