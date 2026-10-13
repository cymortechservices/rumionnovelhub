import "./GlowSearch.css";

// The search bar on Home: a slowly travelling gold-and-rose light runs around its edge so it is
// the first thing the eye finds; it speeds up while the reader is typing.
export default function GlowSearch({ value, onChange, onSubmit }) {
  return (
    <form className="glow-search" onSubmit={onSubmit} role="search">
      <div className="glow-search__ring" aria-hidden="true" />
      <div className="glow-search__field">
        <svg className="glow-search__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className="glow-search__input"
          placeholder="Search novels & authors"
          aria-label="Search novels"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="submit" className="glow-search__go">
          Search
        </button>
      </div>
    </form>
  );
}
