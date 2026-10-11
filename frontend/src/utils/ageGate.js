// Simple, honest 18+ gate: one confirmation stored on this device.
const KEY = "rumion_age_ok";
export const isAgeConfirmed = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};
export const confirmAge = () => {
  try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
};
