const STORAGE_KEY = "govguide_accessibility";

const defaultSettings = {
  fontLarge: false,
  highContrast: false,
  largeControls: false,
  moreSpacing: false,
  reducedMotion: false,
};

function readSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultSettings, ...(stored || {}) };
  } catch {
    return { ...defaultSettings };
  }
}

let settings = readSettings();

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applySettings() {
  const root = document.documentElement;

  root.classList.toggle("font-large", settings.fontLarge);
  root.classList.toggle("high-contrast", settings.highContrast);
  root.classList.toggle("large-controls", settings.largeControls);
  root.classList.toggle("more-spacing", settings.moreSpacing);
  root.classList.toggle("reduced-motion", settings.reducedMotion);

  document.querySelectorAll("[data-setting]").forEach((button) => {
    const key = button.dataset.setting
      .split("-")
      .map((part, index) => index === 0 ? part : part[0].toUpperCase() + part.slice(1))
      .join("");
    button.setAttribute("aria-pressed", String(Boolean(settings[key])));
    button.classList.toggle("active", Boolean(settings[key]));
  });
}

export function toggleSetting(name) {
  if (!(name in settings)) return;
  settings[name] = !settings[name];
  saveSettings();
  applySettings();
}

export function applyProfile(profile) {
  const profileMap = {
    voice: { fontLarge: false, highContrast: false, largeControls: true, moreSpacing: true, reducedMotion: false },
    visual: { fontLarge: true, highContrast: true, largeControls: true, moreSpacing: true, reducedMotion: false },
    simple: { fontLarge: true, highContrast: false, largeControls: true, moreSpacing: true, reducedMotion: true },
    keyboard: { fontLarge: false, highContrast: true, largeControls: true, moreSpacing: true, reducedMotion: true },
  };

  if (!profileMap[profile]) return;
  settings = { ...settings, ...profileMap[profile] };
  saveSettings();
  applySettings();
}

export function resetSettings() {
  settings = { ...defaultSettings };
  saveSettings();
  applySettings();
}

export function initAccessibility() {
  applySettings();

  document.querySelectorAll("[data-setting]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.setting
        .split("-")
        .map((part, index) => index === 0 ? part : part[0].toUpperCase() + part.slice(1))
        .join("");
      toggleSetting(key);
    });
  });
}
