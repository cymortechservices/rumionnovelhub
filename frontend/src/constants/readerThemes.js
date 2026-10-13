// Everything about how a page looks, shared by the reader, the in-reader sheet and Settings.
export const READER_THEMES = {
  parchment: { label: "Parchment", bg: "#f6efe2", text: "#14110f" },
  paper: { label: "Paper", bg: "#ffffff", text: "#1b1b1b" },
  sepia: { label: "Sepia", bg: "#eee2c9", text: "#3a2f1d" },
  rose: { label: "Rose", bg: "#fbeaea", text: "#3d1f26" },
  forest: { label: "Forest", bg: "#e6eee3", text: "#1f2d22" },
  dark: { label: "Dusk", bg: "#211c2e", text: "#ece6f5" },
  midnight: { label: "Midnight", bg: "#0c0f16", text: "#c9d3e0" },
};

export const FONT_STACKS = {
  Literata: '"Literata", Georgia, serif',
  Lora: '"Lora", Georgia, serif',
  Merriweather: '"Merriweather", Georgia, serif',
  Fraunces: '"Fraunces", Georgia, serif',
  Inter: '"Inter", system-ui, sans-serif',
  "Atkinson Hyperlegible": '"Atkinson Hyperlegible", system-ui, sans-serif',
};
export const FONT_OPTIONS = Object.keys(FONT_STACKS);

export const PAGE_TURNS = [
  { key: "curl", label: "Page curl" },
  { key: "slide", label: "Slide" },
  { key: "fade", label: "Fade" },
];

export const ACCENTS = [
  { key: "burgundy", label: "Burgundy", hex: "#7a2331" },
  { key: "gilt", label: "Gilt", hex: "#c9a24b" },
  { key: "sage", label: "Sage", hex: "#5e7c5a" },
  { key: "plum", label: "Plum", hex: "#7b4a8c" },
];

export function getReaderTheme(prefs) {
  if (prefs.theme === "custom") return { bg: prefs.customBg, text: prefs.customText };
  return READER_THEMES[prefs.theme] || READER_THEMES.parchment;
}

export const getAccentHex = (prefs) => (ACCENTS.find((a) => a.key === prefs.accent) || ACCENTS[0]).hex;
