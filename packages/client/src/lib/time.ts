export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 60 / 60);
  const minutes = Math.floor((seconds - hours * 60 * 60) / 60);
  const s = seconds - hours * 60 * 60 - minutes * 60;
  return `${hours}:${minutes}:${s.toFixed(1)}`;
}
