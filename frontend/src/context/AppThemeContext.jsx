import { createContext, useContext, useEffect, useState } from "react";
import { local } from "../utils/store";

// The app's own light/dark look (the reader has its own page colours).
const AppThemeContext = createContext(null);

const initialDark = () => {
  const saved = local.get("rumion_dark");
  if (saved !== null) return saved === "true";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
};

export function AppThemeProvider({ children }) {
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    local.set("rumion_dark", String(dark));
  }, [dark]);

  return <AppThemeContext.Provider value={{ dark, setDark }}>{children}</AppThemeContext.Provider>;
}

export const useAppTheme = () => useContext(AppThemeContext);
