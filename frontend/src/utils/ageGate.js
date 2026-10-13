import { local } from "./store";

// Simple, honest 18+ gate: one confirmation stored on this device.
const KEY = "rumion_age_ok";
export const isAgeConfirmed = () => local.get(KEY) === "1";
export const confirmAge = () => local.set(KEY, "1");
export const clearAgeConfirmation = () => local.remove(KEY);
