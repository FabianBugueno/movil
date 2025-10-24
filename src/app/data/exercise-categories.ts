export const exerciseCategoryNamesEn: { [id: number]: string } = {
  1:  "Abs",
  2:  "Cardio",
  3:  "Calves",
  4:  "Forearms",
  5:  "Glutes",
  6:  "Hamstrings",
  7:  "Lats",
  8:  "Lower Arms",
  9:  "Lower Legs",
  10: "Chest",
  11: "Shoulders",
  12: "Upper Arms",
  13: "Upper Legs",
  14: "Back",
  15: "Traps",
  16: "Full Body"
};

export const exerciseCategoryNamesEs: { [id: number]: string } = {
  1:  "Abdominales",
  2:  "Cardio",
  3:  "Pantorrillas",
  4:  "Antebrazos",
  5:  "Glúteos",
  6:  "Isquiotibiales",
  7:  "Dorsales",
  8:  "Brazos inferiores",
  9:  "Piernas inferiores",
  10: "Pecho",
  11: "Hombros",
  12: "Brazos superiores",
  13: "Piernas superiores",
  14: "Espalda",
  15: "Trapecios",
  16: "Cuerpo completo"
};

export function getCategoryNameEs(id: number | string | undefined): string | null {
  if (id == null) return null;
  const key = typeof id === 'string' ? parseInt(id, 10) : id;
  return exerciseCategoryNamesEs[key] ?? null;
}
