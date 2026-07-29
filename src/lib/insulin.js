export const DEFAULT_SETTINGS = {
  amRatio: 5.5,
  pmRatio: 6.5,
  amCorrectionFactor: 0.2,
  pmCorrectionFactor: 0.2,
  highThreshold: 10,
  lowThreshold: 5,
};

const STORAGE_KEY = "taiaki-huka-settings-v1";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function autoDetectToD(date = new Date()) {
  return date.getHours() < 12 ? "AM" : "PM";
}

export function calculateDose({ bg, carbs, tod, settings }) {
  const ratio = tod === "AM" ? settings.amRatio : settings.pmRatio;
  const cf = tod === "AM" ? settings.amCorrectionFactor : settings.pmCorrectionFactor;
  const correctionMultiplier = ratio * cf;
  const carbCorrection = bg < settings.lowThreshold ? settings.lowThreshold - bg : 0;
  const finalCarbs = Math.max(0, carbs - carbCorrection);
  const doseCorrection = bg > settings.highThreshold ? (bg - settings.highThreshold) * correctionMultiplier : 0;
  const raw = ratio > 0 ? finalCarbs / ratio + doseCorrection : 0;
  const dose = Math.ceil(raw);
  return {
    ratio, correctionFactor: cf, correctionMultiplier,
    carbCorrection, finalCarbs, doseCorrection, rawDose: raw, dose,
    isLow: bg < settings.lowThreshold,
    isHigh: bg > settings.highThreshold,
  };
}