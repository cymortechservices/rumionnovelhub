import { createContext, useContext, useEffect, useState } from "react";

const DEFAULTS = {
  fontFamily: "Literata", // Literata | Inter | Atkinson Hyperlegible
  fontSize: 19, // px
  lineHeight: 1.7,
  theme: "parchment", // parchment | dark | sepia | midnight
  pageTurn: "curl", // curl | slide | fade
  accent: "burgundy", // burgundy | gilt | sage
};

const ReaderPrefsContext = createContext(null);

export function ReaderPrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("rumion_reader_prefs");
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem("rumion_reader_prefs", JSON.stringify(prefs));
  }, [prefs]);

  const updatePrefs = (patch) => setPrefs((p) => ({ ...p, ...patch }));

  return (
    <ReaderPrefsContext.Provider value={{ prefs, updatePrefs }}>
      {children}
    </ReaderPrefsContext.Provider>
  );
}

export const useReaderPrefs = () => useContext(ReaderPrefsContext);
export { DEFAULTS as READER_DEFAULTS };
