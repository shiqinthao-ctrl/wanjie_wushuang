export interface AudioSettings { enabled: boolean; volume: number }
export const audioSettingsKey = 'wanjie-mobile-next:chapter-audio:v1';
export function loadAudioSettings(): AudioSettings {
  try {
    const value = JSON.parse(localStorage.getItem(audioSettingsKey) || 'null');
    return { enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
      volume: typeof value?.volume === 'number' && Number.isFinite(value.volume) ? Math.max(0, Math.min(1, value.volume)) : .65 };
  } catch { return { enabled: true, volume: .65 }; }
}
export function saveAudioSettings(value: AudioSettings): boolean {
  try { localStorage.setItem(audioSettingsKey, JSON.stringify(value)); return true; } catch { return false; }
}
