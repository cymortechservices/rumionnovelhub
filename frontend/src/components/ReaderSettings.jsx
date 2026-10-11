import "./ReaderSettings.css";

const FONTS = ["Literata", "Inter", "Atkinson Hyperlegible"];
const THEMES = [
  { key: "parchment", label: "Parchment" },
  { key: "sepia", label: "Sepia" },
  { key: "dark", label: "Dusk" },
  { key: "midnight", label: "Midnight" },
];
const TURNS = [
  { key: "curl", label: "Page curl" },
  { key: "slide", label: "Slide" },
  { key: "fade", label: "Fade" },
];
const ACCENTS = [
  { key: "burgundy", label: "Burgundy", swatch: "#7A2331" },
  { key: "gilt", label: "Gilt", swatch: "#C9A24B" },
  { key: "sage", label: "Sage", swatch: "#5E7C5A" },
];

export default function ReaderSettings({ prefs, onChange, onClose }) {
  return (
    <div className="reader-settings__overlay" onClick={onClose}>
      <div className="reader-settings" onClick={(e) => e.stopPropagation()}>
        <div className="reader-settings__handle" />
        <h3 className="font-display">Reading preferences</h3>

        <div className="reader-settings__row">
          <label>Font</label>
          <div className="reader-settings__chips">
            {FONTS.map((f) => (
              <button
                key={f}
                className={`chip ${prefs.fontFamily === f ? "is-active" : ""}`}
                style={{ fontFamily: f === "Literata" ? "Literata, serif" : f === "Inter" ? "Inter, sans-serif" : '"Atkinson Hyperlegible", sans-serif' }}
                onClick={() => onChange({ fontFamily: f })}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="reader-settings__row">
          <label>Text size — {prefs.fontSize}px</label>
          <input
            type="range"
            min="15"
            max="26"
            value={prefs.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          />
        </div>

        <div className="reader-settings__row">
          <label>Line spacing — {prefs.lineHeight.toFixed(1)}</label>
          <input
            type="range"
            min="1.3"
            max="2.1"
            step="0.1"
            value={prefs.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
          />
        </div>

        <div className="reader-settings__row">
          <label>Page background</label>
          <div className="reader-settings__chips">
            {THEMES.map((t) => (
              <button
                key={t.key}
                className={`chip ${prefs.theme === t.key ? "is-active" : ""}`}
                onClick={() => onChange({ theme: t.key })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reader-settings__row">
          <label>Page turn</label>
          <div className="reader-settings__chips">
            {TURNS.map((t) => (
              <button
                key={t.key}
                className={`chip ${prefs.pageTurn === t.key ? "is-active" : ""}`}
                onClick={() => onChange({ pageTurn: t.key })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="reader-settings__row">
          <label>Accent</label>
          <div className="reader-settings__swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                className={`swatch ${prefs.accent === a.key ? "is-active" : ""}`}
                style={{ background: a.swatch }}
                aria-label={a.label}
                onClick={() => onChange({ accent: a.key })}
              />
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
