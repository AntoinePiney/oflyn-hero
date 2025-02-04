import Stats from "stats.js";

export function initStats() {
  const stats = new Stats();
  stats.showPanel(0);
  return stats;
}
