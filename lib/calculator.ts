export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type FitnessGoal = "lose" | "maintain" | "gain";
export type Gender = "male" | "female";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

const CALORIE_ADJUSTMENT: Record<FitnessGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300
};

const MIN_CALORIES = 1200;
const PROTEIN_PER_KG: Record<FitnessGoal, number> = { lose: 2.2, maintain: 2.0, gain: 2.0 };
const FAT_SHARE_OF_CALORIES = 0.25;
const WATER_ML_PER_KG = 35;
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

/** Mifflin-St Jeor resting metabolic rate. */
function basalMetabolicRate({ gender, weightKg, heightCm, age }: CalculatorInput) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

function targetWeight(weightKg: number, goal: FitnessGoal) {
  if (goal === "lose") return Math.round(weightKg * 0.9 * 2) / 2;
  if (goal === "gain") return Math.round(weightKg * 1.05 * 2) / 2;
  return weightKg;
}

export function calculateGoals(input: CalculatorInput): CalculatedGoals {
  const { weightKg, activityLevel, goal } = input;

  const bmr = basalMetabolicRate(input);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  const calories = Math.max(MIN_CALORIES, tdee + CALORIE_ADJUSTMENT[goal]);

  const protein = Math.round(weightKg * PROTEIN_PER_KG[goal]);
  const fat = Math.round((calories * FAT_SHARE_OF_CALORIES) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  const waterMl = Math.round((weightKg * WATER_ML_PER_KG) / WATER_ROUNDING_ML) * WATER_ROUNDING_ML;

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
