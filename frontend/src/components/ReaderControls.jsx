import {
  ACCENTS,
  FONT_OPTIONS,
  FONT_STACKS,
  PAGE_TURNS,
  READER_THEMES,
} from "../constants/readerThemes";
import "./ReaderControls.css";

// Every way a reader can make a page their own. Used inside the reader ("Aa") and in Settings.
export default function ReaderControls({ prefs, onChange, onReset }) {
  return (
    <div className="rc">
      <div className="rc__row">
        <p className="rc__label">Font</p>
        <div className="rc__chips" role="group" aria-label="Font">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${prefs.fontFamily === f ? "is-active" : ""}`}
              style={{ fontFamily: FONT_STACKS[f] }}
              onClick={() => onChange({ fontFamily: f })}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rc__row">
        <label className="rc__label" htmlFor="rc-size">
          Text size <span className="rc__value">{prefs.fontSize}px</span>
        </label>
        <input
          id="rc-size"
          type="range"
          min="15"
          max="28"
          value={prefs.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        />
      </div>

      <div className="rc__row">
        <label className="rc__label" htmlFor="rc-line">
          Line spacing <span className="rc__value">{Number(prefs.lineHeight).toFixed(1)}</span>
        </label>
        <input
          id="rc-line"
          type="range"
          min="1.3"
          max="2.2"
          step="0.1"
          value={prefs.lineHeight}
          onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
        />
      </div>

      <div className="rc__row">
        <p className="rc__label">Page colour</p>
        <div className="rc__tiles" role="group" aria-label="Page colour">
          {Object.entries(READER_THEMES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              className={`rc__tile ${prefs.theme === key ? "is-active" : ""}`}
              style={{ background: t.bg, color: t.text }}
              onClick={() => onChange({ theme: key })}
              aria-pressed={prefs.theme === key}
            >
              <span className="rc__tile-aa">Aa</span>
              <span className="rc__tile-name">{t.label}</span>
            </button>
          ))}
          <button
            type="button"
            className={`rc__tile rc__tile--custom ${prefs.theme === "custom" ? "is-active" : ""}`}
            style={{ background: prefs.customBg, color: prefs.customText }}
            onClick={() => onChange({ theme: "custom" })}
            aria-pressed={prefs.theme === "custom"}
          >
            <span className="rc__tile-aa">Aa</span>
            <span className="rc__tile-name">Custom</span>
          </button>
        </div>
        {prefs.theme === "custom" && (
          <div className="rc__custom">
            <label>
              Page
              <input type="color" value={prefs.customBg} onChange={(e) => onChange({ customBg: e.target.value })} />
            </label>
            <label>
              Text
              <input type="color" value={prefs.customText} onChange={(e) => onChange({ customText: e.target.value })} />
            </label>
          </div>
        )}
      </div>

      <div className="rc__row">
        <p className="rc__label">Reading mode</p>
        <div className="rc__chips" role="group" aria-label="Reading mode">
          {[
            { key: "pages", label: "Turn pages" },
            { key: "scroll", label: "Scroll" },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              className={`chip ${(prefs.readMode || "pages") === m.key ? "is-active" : ""}`}
              onClick={() => onChange({ readMode: m.key })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rc__row">
        <p className="rc__label">Page turn</p>
        <div className="rc__chips" role="group" aria-label="Page turn">
          {PAGE_TURNS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`chip ${prefs.pageTurn === t.key ? "is-active" : ""}`}
              onClick={() => onChange({ pageTurn: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rc__row">
        <p className="rc__label">Accent</p>
        <div className="rc__swatches" role="group" aria-label="Accent colour">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`rc__swatch ${prefs.accent === a.key ? "is-active" : ""}`}
              style={{ background: a.hex }}
              aria-label={a.label}
              aria-pressed={prefs.accent === a.key}
              onClick={() => onChange({ accent: a.key })}
            />
          ))}
        </div>
      </div>

      {onReset && (
        <button type="button" className="rc__reset" onClick={onReset}>
          Reset to defaults
        </button>
      )}
    </div>
  );
}
