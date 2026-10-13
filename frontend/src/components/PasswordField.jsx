import { useState } from "react";

export default function PasswordField({ value, onChange, placeholder = "Password", autoComplete, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input
        className="input"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
      <button type="button" className="pw__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
