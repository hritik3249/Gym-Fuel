export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type FitnessGoal = "lose" | "maintain" | "gain";
export type Gender = "male" | "female";

// Slightly compressed from the textbook Harris values (1.2–1.9): people
// consistently overestimate their activity level, so the top tiers are the
// single biggest source of inflated calorie targets.
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.35,
  moderate: 1.5,
  active: 1.65,
  very_active: 1.8
};

// Percent-based calorie adjustments scale with the person instead of a flat
// ±500 kcal, with clamps so small users aren't starved and large users
// aren't given extreme deficits/surpluses.
const LOSE_DEFICIT_PCT   = 0.20;  // 20% below TDEE ≈ 0.5 kg/week for most
const LOSE_DEFICIT_MIN   = 300;
const LOSE_DEFICIT_MAX   = 750;
const GAIN_SURPLUS_PCT   = 0.10;  // lean-gain pace, minimises fat gain
const GAIN_SURPLUS_MIN   = 200;
const GAIN_SURPLUS_MAX   = 400;

const MIN_CALORIES: Record<Gender, number> = { male: 1500, female: 1200 };

// Protein per kg of REFERENCE weight (see referenceWeight below), not raw
// body weight — 1.6–1.8 g/kg covers maximal muscle-protein synthesis for
// nearly everyone (Morton et al. meta-analysis: benefits plateau ~1.6).
const PROTEIN_PER_KG: Record<FitnessGoal, number> = { lose: 1.8, maintain: 1.6, gain: 1.8 };

const FAT_SHARE_OF_CALORIES = 0.25;
const FAT_MIN_PER_KG = 0.6;   // hormonal-health floor, g per kg reference weight
const CARB_MIN_G = 50;        // below this fat share is trimmed to make room

const WATER_ML_PER_KG = 33;
const WATER_MIN_ML = 2000;
const WATER_MAX_ML = 4000;
const WATER_ROUNDING_ML = 250;

export type CalculatorInput = {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
};

export type CalculatedGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  targetWeightKg: number;
  tdee: number;
  bmr: number;
};

/** Mifflin-St Jeor resting metabolic rate — the most validated equation
 *  for the general population. */
function basalMetabolicRate({ gender, weightKg, heightCm, age }: CalculatorInput) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/** Weight used for protein/fat dosing. For overweight users (BMI > 25),
 *  raw body weight overdoses protein massively (fat mass doesn't need
 *  protein), so we use ideal weight (BMI 22) + 25% of the excess —
 *  the standard "adjusted body weight" approach from clinical nutrition. */
function referenceWeight(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return weightKg;
  const bmi = weightKg / (heightM * heightM);
  if (bmi <= 25) return weightKg;
  const idealWeight = 22 * heightM * heightM;
  return idealWeight + 0.25 * (weightKg - idealWeight);
}

function targetWeight(weightKg: number, goal: FitnessGoal) {
  if (goal === "lose") return Math.round(weightKg * 0.9 * 2) / 2;
  if (goal === "gain") return Math.round(weightKg * 1.05 * 2) / 2;
  return weightKg;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateGoals(input: CalculatorInput): CalculatedGoals {
  const { weightKg, heightCm, gender, activityLevel, goal } = input;

  const bmr = basalMetabolicRate(input);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);

  let calories = tdee;
  if (goal === "lose") {
    calories = tdee - clamp(tdee * LOSE_DEFICIT_PCT, LOSE_DEFICIT_MIN, LOSE_DEFICIT_MAX);
  } else if (goal === "gain") {
    calories = tdee + clamp(tdee * GAIN_SURPLUS_PCT, GAIN_SURPLUS_MIN, GAIN_SURPLUS_MAX);
  }
  calories = Math.round(Math.max(MIN_CALORIES[gender], calories));

  const refWeight = referenceWeight(weightKg, heightCm);
  const protein = Math.round(refWeight * PROTEIN_PER_KG[goal]);

  let fat = Math.round((calories * FAT_SHARE_OF_CALORIES) / 9);
  fat = Math.max(fat, Math.round(refWeight * FAT_MIN_PER_KG));

  let carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  if (carbs < CARB_MIN_G) {
    // Trim fat back toward its floor to keep a workable carb minimum
    const fatFloor = Math.round(refWeight * FAT_MIN_PER_KG);
    const neededFromFat = Math.ceil(((CARB_MIN_G - carbs) * 4) / 9);
    fat = Math.max(fatFloor, fat - neededFromFat);
    carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  }

  const waterMl =
    Math.round(clamp(weightKg * WATER_ML_PER_KG, WATER_MIN_ML, WATER_MAX_ML) / WATER_ROUNDING_ML) * WATER_ROUNDING_ML;

  return {
    calories,
    protein,
    carbs,
    fat,
    waterMl,
    targetWeightKg: targetWeight(weightKg, goal),
    tdee,
    bmr: Math.round(bmr)
  };
}
