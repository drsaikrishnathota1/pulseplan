import type {
  ActivityLevel,
  Gender,
  Goal,
  HealthMetrics,
  ScanResult,
  UserProfile,
} from "../types";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function deurenbergBodyFatPct(bmi: number, age: number, gender: Gender): number {
  const g = gender === "male" ? 1 : 0;
  const raw = 1.2 * bmi + 0.23 * age - 10.8 * g - 5.4;
  return Math.min(60, Math.max(5, raw));
}

function mifflinStJeorBmr(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/** Small illustrative adjustment from resting HR vs population mean (~62). Not clinical. */
function hrAdjustedBmr(bmr: number, restingHr: number): number {
  const delta = (restingHr - 62) / 500;
  const factor = 1 + Math.min(0.06, Math.max(-0.04, delta));
  return Math.round(bmr * factor);
}

function goalCalorieDelta(goal: Goal): number {
  if (goal === "lose") return -450;
  if (goal === "gain") return 350;
  return 0;
}

function macroSplit(
  targetKcal: number,
  weightKg: number,
  goal: Goal
): { proteinG: number; fatG: number; carbG: number } {
  const proteinPerKg = goal === "lose" ? 2.1 : goal === "gain" ? 1.8 : 1.9;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinKcal = proteinG * 4;
  const fatKcal = targetKcal * 0.28;
  const fatG = Math.round(fatKcal / 9);
  const carbKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
  const carbG = Math.round(carbKcal / 4);
  return { proteinG, fatG, carbG };
}

function buildSchedule(profile: UserProfile, targetKcal: number): { time: string; label: string }[] {
  const meals =
    profile.goal === "lose"
      ? ["Light breakfast", "Protein snack", "Lunch", "Afternoon snack", "Dinner"]
      : profile.goal === "gain"
        ? ["Hearty breakfast", "Mid-morning meal", "Lunch", "Pre-workout snack", "Dinner", "Evening top-up"]
        : ["Breakfast", "Snack", "Lunch", "Snack", "Dinner"];

  const times =
    profile.goal === "gain"
      ? ["06:30", "09:30", "12:30", "15:30", "18:30", "21:00"]
      : ["07:00", "10:00", "13:00", "16:00", "19:00"];

  const workoutLabel =
    profile.activity === "sedentary"
      ? "20-min walk"
      : profile.activity === "light"
        ? "30-min brisk walk or yoga"
        : profile.activity === "moderate"
          ? "45-min strength + cardio"
          : profile.activity === "active"
            ? "60-min gym session"
            : "75-min intense training";

  const rows: { time: string; label: string }[] = [
    { time: "06:00", label: "Wake up, hydrate (500 ml water)" },
  ];

  meals.forEach((m, i) => {
    rows.push({ time: times[i] ?? `${11 + i}:00`, label: m });
  });

  rows.push({ time: "17:30", label: workoutLabel });
  rows.push({
    time: "22:30",
    label: `Wind down — aim ~${Math.round(targetKcal * 0.03)} kcal evening snack if hungry`,
  });
  rows.push({ time: "23:00", label: "Sleep (7.5–8 h target)" });

  return rows;
}

function buildWorkouts(profile: UserProfile): {
  day: string;
  title: string;
  durationMin: number;
  estBurnKcal: number;
}[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const mult = ACTIVITY_FACTORS[profile.activity] / 1.55;
  const baseBurn = Math.round(180 * mult + (profile.weightKg / 80) * 40);

  const templates =
    profile.goal === "lose"
      ? [
          { title: "Full body strength + incline walk", durationMin: 50, k: 1.0 },
          { title: "Zone-2 cardio (bike or walk)", durationMin: 40, k: 0.85 },
          { title: "Upper body + core circuits", durationMin: 45, k: 0.95 },
          { title: "Active recovery walk", durationMin: 35, k: 0.55 },
          { title: "Lower body + finisher", durationMin: 50, k: 1.05 },
          { title: "Optional long walk", durationMin: 60, k: 0.7 },
          { title: "Rest or light mobility", durationMin: 25, k: 0.35 },
        ]
      : profile.goal === "gain"
        ? [
            { title: "Push (chest, shoulders, triceps)", durationMin: 65, k: 0.75 },
            { title: "Pull (back, biceps)", durationMin: 65, k: 0.75 },
            { title: "Legs + posterior chain", durationMin: 70, k: 0.95 },
            { title: "Light cardio + mobility", durationMin: 35, k: 0.45 },
            { title: "Upper hypertrophy", durationMin: 60, k: 0.7 },
            { title: "Lower volume + accessories", durationMin: 60, k: 0.8 },
            { title: "Rest", durationMin: 0, k: 0 },
          ]
        : [
            { title: "Strength A (squat pattern)", durationMin: 50, k: 0.9 },
            { title: "Easy run or cycle", durationMin: 35, k: 0.65 },
            { title: "Strength B (hinge pattern)", durationMin: 50, k: 0.9 },
            { title: "Swim or row intervals", durationMin: 40, k: 0.85 },
            { title: "Full body circuits", durationMin: 40, k: 0.95 },
            { title: "Long steady cardio", durationMin: 50, k: 0.7 },
            { title: "Rest + stretch", durationMin: 30, k: 0.3 },
          ];

  return days.map((day, i) => {
    const t = templates[i]!;
    const estBurnKcal = t.durationMin === 0 ? 0 : Math.round(baseBurn * t.k);
    return { day, title: t.title, durationMin: t.durationMin, estBurnKcal };
  });
}

export function computeHealth(profile: UserProfile, scan: ScanResult): HealthMetrics {
  const heightM = profile.heightCm / 100;
  const bmi = profile.weightKg / (heightM * heightM);
  const bodyFatPct = deurenbergBodyFatPct(bmi, profile.age, profile.gender);
  const leanMassKg = profile.weightKg * (1 - bodyFatPct / 100);

  const bmrBase = Math.round(mifflinStJeorBmr(profile.weightKg, profile.heightCm, profile.age, profile.gender));
  const bmrAdjusted = hrAdjustedBmr(bmrBase, scan.restingHr);
  const tdee = Math.round(bmrAdjusted * ACTIVITY_FACTORS[profile.activity]);
  const targetCalories = Math.max(1200, Math.round(tdee + goalCalorieDelta(profile.goal)));

  const { proteinG, fatG, carbG } = macroSplit(targetCalories, profile.weightKg, profile.goal);

  return {
    bmi: Math.round(bmi * 10) / 10,
    bodyFatPct: Math.round(bodyFatPct * 10) / 10,
    leanMassKg: Math.round(leanMassKg * 10) / 10,
    bmrBase,
    bmrAdjusted,
    tdee,
    targetCalories,
    proteinG,
    carbG,
    fatG,
    dailySchedule: buildSchedule(profile, targetCalories),
    workouts: buildWorkouts(profile),
  };
}

/** Deterministic pseudo-random 0..1 from seed (integer). */
export function seededNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function simulateScanDerivedMetrics(
  profile: UserProfile,
  elapsedSec: number
): Pick<ScanResult, "restingHr" | "hrvRmssd"> {
  const t = Math.min(1, elapsedSec / 60);
  const baseHr = 58 + profile.age * 0.12 + (profile.activity === "very_active" ? 6 : 0);
  const restingHr = Math.round(baseHr + (1 - t) * 8 + seededNoise(elapsedSec + 1) * 4 - 2);
  const hrvBase = profile.goal === "lose" ? 38 : 48;
  const hrvRmssd = Math.round(
    hrvBase + seededNoise(elapsedSec + 99) * 22 - (profile.activity === "sedentary" ? 8 : 0) + t * 6
  );
  return { restingHr: Math.min(95, Math.max(48, restingHr)), hrvRmssd: Math.min(90, Math.max(18, hrvRmssd)) };
}
