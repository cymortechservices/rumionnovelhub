import { useState } from "react";
import "./StarRating.css";

export default function StarRating({ value = 0, onRate, size = 22, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="star-rating" role={readOnly ? undefined : "radiogroup"} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${n <= shown ? "is-filled" : ""}`}
          style={{ fontSize: size }}
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onRate?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
