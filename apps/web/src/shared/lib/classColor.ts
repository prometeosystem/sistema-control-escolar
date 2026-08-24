const PALETTE = [
  "#0f6b4c",
  "#1a5fb4",
  "#813d9c",
  "#c64600",
  "#986a44",
  "#2ec27e",
  "#3584e4",
  "#e66100",
  "#9141ac",
  "#26a269",
];

export function classBannerColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
