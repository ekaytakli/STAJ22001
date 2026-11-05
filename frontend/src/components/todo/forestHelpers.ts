export const TREES_PER_GROVE = 12;
export type ForestStyle = "mixed" | "pine" | "blossom";

export function forestProgress(completed: number) {
  const count = Math.max(0, Math.floor(completed));
  const milestones = [0, 1, 5, 15, 30, 60, 100];
  const next = milestones.find((milestone) => milestone > count)
    ?? (Math.floor(count / 100) + 1) * 100;
  const previous = [...milestones].reverse().find((milestone) => milestone <= count) ?? 0;
  const start = count >= 100 ? Math.floor(count / 100) * 100 : previous;
  const level = count === 0 ? "İlk tohum" : count < 5 ? "Fidanlık" : count < 15
    ? "Küçük koru" : count < 30 ? "Yeşil vadi" : count < 60 ? "Büyüyen orman" : "Kök salan orman";
  return { count, next, remaining: next - count, level,
    percentage: Math.round((count - start) / (next - start) * 100),
    groves: Math.max(1, Math.ceil(count / TREES_PER_GROVE)) };
}

export function readForestStyle(userId: number): ForestStyle {
  try {
    const saved = localStorage.getItem(`odak:forest-style:${userId}`);
    return saved === "pine" || saved === "blossom" ? saved : "mixed";
  } catch { return "mixed"; }
}
