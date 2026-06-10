import { calculateGoals, type CalculatorInput } from "../lib/calculator";

const cases: Array<{ label: string; input: CalculatorInput }> = [
  { label: "90kg overweight male, 175cm, 28y, moderate, lose", input: { age: 28, gender: "male", heightCm: 175, weightKg: 90, activityLevel: "moderate", goal: "lose" } },
  { label: "60kg female, 160cm, 25y, light, lose",             input: { age: 25, gender: "female", heightCm: 160, weightKg: 60, activityLevel: "light", goal: "lose" } },
  { label: "70kg male, 178cm, 22y, active, gain",              input: { age: 22, gender: "male", heightCm: 178, weightKg: 70, activityLevel: "active", goal: "gain" } },
  { label: "55kg female, 155cm, 35y, sedentary, maintain",     input: { age: 35, gender: "female", heightCm: 155, weightKg: 55, activityLevel: "sedentary", goal: "maintain" } },
  { label: "120kg male, 180cm, 40y, sedentary, lose",          input: { age: 40, gender: "male", heightCm: 180, weightKg: 120, activityLevel: "sedentary", goal: "lose" } },
];

for (const c of cases) {
  const g = calculateGoals(c.input);
  const macroKcal = g.protein * 4 + g.carbs * 4 + g.fat * 9;
  console.log(c.label);
  console.log(`  bmr ${g.bmr} | tdee ${g.tdee} | kcal ${g.calories} | P ${g.protein}g C ${g.carbs}g F ${g.fat}g | macro-kcal ${macroKcal} | water ${g.waterMl}ml`);
}
