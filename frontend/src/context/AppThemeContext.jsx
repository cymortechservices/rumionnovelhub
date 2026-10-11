import { createContext, useContext, useEffect, useState } from "react";

// Controls the overall app chrome (not the in-reader theme, which ReaderPrefsContext owns).
const AppThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem("rumion_dark") === "true");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("rumion_dark", String(dark));
  }, [dark]);

  return (
    <AppThemeContext.Provider value={{ dark, setDark }}>{children}</AppThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(AppThemeContext);
