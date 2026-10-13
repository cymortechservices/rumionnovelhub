import ReaderControls from "./ReaderControls";
import "./ReaderSettings.css";

// Bottom sheet opened from the "Aa" button inside the reader.
export default function ReaderSettings({ prefs, onChange, onReset, onClose }) {
  return (
    <div className="reader-settings__overlay" onClick={onClose}>
      <div
        className="reader-settings"
        role="dialog"
        aria-modal="true"
        aria-label="Reading preferences"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="reader-settings__handle" />
        <h3 className="font-display">Reading preferences</h3>
        <ReaderControls prefs={prefs} onChange={onChange} onReset={onReset} />
        <button className="btn btn-primary btn-block" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
