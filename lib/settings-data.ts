const SETTINGS_KEY = "baran_app_settings";

type AppSettings = {
  passwordHash: string | null;
  pointValue: number;
};

const DEFAULT_SETTINGS: AppSettings = {
  passwordHash: null,
  pointValue: 0,
};

function getSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(saved);

    return {
      passwordHash:
        typeof parsed.passwordHash === "string"
          ? parsed.passwordHash
          : null,
      pointValue:
        typeof parsed.pointValue === "number"
          ? parsed.pointValue
          : 0,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    data
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hasSettingsPassword() {
  return getSettings().passwordHash !== null;
}

export async function createSettingsPassword(
  password: string
) {
  const cleanPassword = password.trim();

  if (cleanPassword.length < 4) {
    return false;
  }

  const passwordHash = await hashPassword(cleanPassword);

  const settings = getSettings();

  saveSettings({
    ...settings,
    passwordHash,
  });

  return true;
}

export async function verifySettingsPassword(
  password: string
) {
  const settings = getSettings();

  if (!settings.passwordHash) {
    return false;
  }

  const passwordHash = await hashPassword(password);

  return passwordHash === settings.passwordHash;
}

export async function changeSettingsPassword(
  currentPassword: string,
  newPassword: string
) {
  const verified = await verifySettingsPassword(
    currentPassword
  );

  if (!verified) {
    return false;
  }

  return createSettingsPassword(newPassword);
}

export function getPointValue() {
  return getSettings().pointValue;
}

export function setPointValue(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return false;
  }

  const settings = getSettings();

  saveSettings({
    ...settings,
    pointValue: value,
  });

  return true;
}