export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Goal = "lose" | "maintain" | "gain";

export type UserProfile = {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: Goal;
};

export type ScanResult = {
  restingHr: number;
  hrvRmssd: number;
  scanSeconds: number;
};

export type HealthMetrics = {
  bmi: number;
  bodyFatPct: number;
  leanMassKg: number;
  bmrBase: number;
  bmrAdjusted: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  dailySchedule: { time: string; label: string }[];
  workouts: { day: string; title: string; durationMin: number; estBurnKcal: number }[];
};
