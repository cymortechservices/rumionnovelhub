import { NavLink } from "react-router-dom";
import "./BottomNav.css";

const ICONS = {
  home: (
    <path d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  favorites: (
    <path d="M12 20s-7.5-4.6-9.7-9.3C.7 7 2.4 3.8 5.9 3.4c2-.2 3.7.9 4.9 2.6C12 4.3 13.7 3.2 15.7 3.4c3.5.4 5.2 3.6 3.6 7.3C17.1 15.4 12 20 12 20Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  ),
  author: (
    <path d="M4 20h4.2L18 10.2a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8V20Z M13.5 6.5l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.4-2-3.4-2.3.7a7.7 7.7 0 0 0-1.8-1L14.8 3H9.2l-.5 2.9a7.7 7.7 0 0 0-1.8 1l-2.3-.7-2 3.4L4.6 11a7.6 7.6 0 0 0 0 2l-2 1.4 2 3.4 2.3-.7a7.7 7.7 0 0 0 1.8 1l.5 2.9h5.6l.5-2.9a7.7 7.7 0 0 0 1.8-1l2.3.7 2-3.4Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
};

const ITEMS = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/favorites", label: "Favorites", icon: "favorites" },
  { to: "/author", label: "Author", icon: "author" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `bottom-nav__item ${isActive ? "is-active" : ""}`}
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            {ICONS[item.icon]}
          </svg>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
