import { confirmAge } from "../utils/ageGate";

export default function AgeGate({ onConfirm, onLeave }) {
  return (
    <div className="container" style={{ padding: "48px 18px", textAlign: "center" }}>
      <h2 className="font-display" style={{ marginBottom: 8 }}>18+ content</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        These stories contain mature themes. Please confirm you are 18 or older to continue.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn btn-ghost" onClick={onLeave}>Take me back</button>
        <button className="btn btn-primary" onClick={() => { confirmAge(); onConfirm(); }}>
          I am 18 or older
        </button>
      </div>
    </div>
  );
}
