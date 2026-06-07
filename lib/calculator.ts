export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type FitnessGoal = "lose" | "maintain" | "gain";
export type Gender = "male" | "female";

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

export function calculateGoals(params: {
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
}) {
  const { age, gender, heightCm, weightKg, activityLevel, goal } = params;

  // Mifflin-St Jeor BMR
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = Math.round(bmr * activityMultipliers[activityLevel]);

  // Adjust calories based on goal
  const calorieAdjust = goal === "lose" ? -500 : goal === "gain" ? 300 : 0;
  const calories = Math.max(1200, tdee + calorieAdjust);

  // Macro split
  // Protein: 2g per kg bodyweight for gain/maintain, 2.2g for lose
  const proteinPerKg = goal === "lose" ? 2.2 : 2.0;
  const protein = Math.round(weightKg * proteinPerKg);

  // Fat: 25% of calories
  const fat = Math.round((calories * 0.25) / 9);

  // Carbs: remaining calories
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbs = Math.round((calories - proteinCals - fatCals) / 4);

  // Water: 35ml per kg
  const waterMl = Math.round(weightKg * 35 / 250) * 250;

  return {
    calories,
    protein,
    carbs: Math.max(0, carbs),
    fat,
    waterMl,
    targetWeightKg:
      goal === "lose"
        ? Math.round(weightKg * 0.9 * 2) / 2
        : goal === "gain"
        ? Math.round(weightKg * 1.05 * 2) / 2
        : weightKg,
    tdee,
    bmr: Math.round(bmr)
  };
}
