import { createContext, useContext, useEffect, useState } from "react";
import { local } from "../utils/store";

const DEFAULTS = {
  fontFamily: "Literata",
  fontSize: 19, // px
  lineHeight: 1.7,
  theme: "parchment", // see constants/readerThemes.js, or "custom"
  pageTurn: "curl", // curl | slide | fade
  readMode: "pages", // pages | scroll
  accent: "burgundy",
  customBg: "#fff8e7",
  customText: "#2b2118",
};

const ReaderPrefsContext = createContext(null);

export function ReaderPrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = local.get("rumion_reader_prefs");
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    local.set("rumion_reader_prefs", JSON.stringify(prefs));
  }, [prefs]);

  const updatePrefs = (patch) => setPrefs((p) => ({ ...p, ...patch }));
  const resetPrefs = () => setPrefs(DEFAULTS);

  return (
    <ReaderPrefsContext.Provider value={{ prefs, updatePrefs, resetPrefs }}>
      {children}
    </ReaderPrefsContext.Provider>
  );
}

export const useReaderPrefs = () => useContext(ReaderPrefsContext);
export { DEFAULTS as READER_DEFAULTS };
